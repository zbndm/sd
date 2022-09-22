--------------------------------COMING SOON--------------------------------

# 0.1.0_beta

After __ months of development we are extremely excited to be releasing the first version of Spacedrive as an early public beta.

This is an MVP, and by no means feature complete. Please test out the features listed below and give us feedback via Discord, email or GitHub Issues :D

This release is missing database synchronization between nodes (your devices), for now this renders connecting nodes useless, other than to transfer individual files. But don't worry, its coming very soon!

*Features:*

- Support for Windows, Linux and macOS, iOS and Android.

- Basic onboarding flow, determine use-case and preferences.

- Create [Libraries](../architecture/libraries.md) and switch between them.

- Connect multiple [Nodes](../architecture/nodes.md) to a Library via LAN.

- Add [Locations](../architecture/locations.md) to import files into Spacedrive.
  - Indexer watch for changes and performs light re-scans.
  
  - Identifier generates checksum and categorizes files into [Objects]()
  
  - Define rules for indexer to ignore certain files or folders.
  
    *Eventually Clouds will be supported and added as Cloud Locations*
  
- Browse Locations via the [Explorer](../architecture/explorer.md) and view previews and metadata.
  - Viewer options: row/grid item size, gap adjustment, show/hide info.
  - Context menu: rename, copy, duplicate, delete, favorite and add tags.
  - Multi-select with dedicated context menu options.
  - Open with default OS app, in-app viewer (images/text only) or Apple Quicklook
  
- Automatically identify unique files to discover duplicates, shown in the inspector.

- Generate [Preview Media](../architecture/preview-media.md) for image, video and text.

- Create [Tags](../architecture/tags.md) and assign them to files, browse Tags in the Explorer.

- Create [Spaces](../architecture/spaces.md) to organize and present files.

  - Automated Spaces can include files that match criteria.

    *Eventually Spaces will be sharable, publically or privately*

- Create photo [Albums](../architecture/albums.md) and add images.

- Library statistics: total capacity, database size, preview media size, free space.

- [Search](../architecture/search.md) Library via search bar or CTRL+F.

  - Searches online and offline Locations, Spaces, Tags and Albums.

- Drag and drop file transfer on a keybind.

  - Defaults to CTRL+Space, also possible from Explorer context menu.

- Customize sidebar freely with section headings and flexible slots, include default layout.

- Pause and resume [Jobs](../architecture/jobs.md) with recovery on crash via Job Manager widget.

- Multi-window support.

- Update installer.

- Optional crash reporting.