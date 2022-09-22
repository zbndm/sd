use crate::{
	encode::{ThumbnailJob, ThumbnailJobInit},
	file::cas::{FileIdentifierJob, FileIdentifierJobInit},
	job::{Job, JobManager},
	location::{fetch_location, LocationError},
	prisma::location,
};

use rspc::{ErrorCode, Type};
use serde::Deserialize;
use std::path::PathBuf;

use super::{utils::LibraryRequest, CoreEvent, RouterBuilder};

#[derive(Type, Deserialize)]
pub struct GenerateThumbsForLocationArgs {
	pub id: i32,
	pub path: PathBuf,
}

#[derive(Type, Deserialize)]
pub struct IdentifyUniqueFilesArgs {
	pub id: i32,
	pub path: PathBuf,
}

pub(crate) fn mount() -> RouterBuilder {
	<RouterBuilder>::new()
		.library_query("getRunning", |ctx, _: (), _| async move {
			Ok(ctx.jobs.get_running().await)
		})
		.library_query("getHistory", |_, _: (), library| async move {
			Ok(JobManager::get_history(&library).await?)
		})
		.library_mutation(
			"generateThumbsForLocation",
			|_, args: GenerateThumbsForLocationArgs, library| async move {
				if library
					.db
					.location()
					.count(vec![location::id::equals(args.id)])
					.exec()
					.await? == 0
				{
					return Err(LocationError::IdNotFound(args.id).into());
				}

				library
					.spawn_job(Job::new(
						ThumbnailJobInit {
							location_id: args.id,
							path: args.path,
							background: false, // fix
						},
						Box::new(ThumbnailJob {}),
					))
					.await;

				Ok(())
			},
		)
		.library_mutation(
			"identifyUniqueFiles",
			|_, args: IdentifyUniqueFilesArgs, library| async move {
				if fetch_location(&library, args.id).exec().await?.is_none() {
					return Err(rspc::Error::new(
						ErrorCode::NotFound,
						"Location not found".into(),
					));
				}

				library
					.spawn_job(Job::new(
						FileIdentifierJobInit {
							location_id: args.id,
							sub_path: Some(args.path),
						},
						Box::new(FileIdentifierJob {}),
					))
					.await;

				Ok(())
			},
		)
		.library_subscription("newThumbnail", |ctx, _: (), _| {
			// TODO: Only return event for the library that was subscribed to

			let mut event_bus_rx = ctx.event_bus.subscribe();
			async_stream::stream! {
				while let Ok(event) = event_bus_rx.recv().await {
					match event {
						CoreEvent::NewThumbnail { cas_id } => yield cas_id,
						_ => {}
					}
				}
			}
		})
}
