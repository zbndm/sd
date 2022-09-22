import { ClientTransformer, OperationKey, OperationType, RSPCError, Transport } from '@rspc/client';
import { createReactQueryHooks } from '@rspc/react';
import {
	QueryClient,
	UseMutationOptions,
	UseMutationResult,
	UseQueryOptions,
	UseQueryResult,
	useMutation as _useMutation
} from '@tanstack/react-query';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { useSnapshot } from 'valtio';

import { libraryStore } from '../stores/libraryStore';
import type { LibraryArgs, Operations } from '../types/bindings';

export const queryClient = new QueryClient();
export const rspc = createReactQueryHooks<Operations>();

const { SDCore } = NativeModules;
const eventEmitter = new NativeEventEmitter(NativeModules.SDCore);

// TODO(@Oscar): Replace this with a better abstraction when it's released in rspc. This relies on internal details of rspc which will change without warning.
export class ReactNativeTransport implements Transport {
	transformer?: ClientTransformer;
	clientSubscriptionCallback?: (id: string, key: string, value: any) => void;

	constructor() {
		const subscriptionEventListener = eventEmitter.addListener('SDCoreEvent', (event) => {
			const body = JSON.parse(event);
			if (body.type === 'event') {
				const { id, key, result } = body;
				this.clientSubscriptionCallback(id, key, result);
			} else if (body.type === 'response' || body.type === 'error') {
				throw new Error(
					`Recieved event of type '${body.type}'. This should be impossible with the React Native transport!`
				);
			} else {
				console.error(`Received event of unknown method '${body.type}'`);
			}
		});
	}

	async doRequest(operation: OperationType, key: OperationKey): Promise<any> {
		const body = JSON.parse(
			await SDCore.sd_core_msg(
				JSON.stringify({
					operation,
					key: this.transformer?.serialize(operation, key) || key
				})
			)
		);
		if (body.type === 'error') {
			const { status_code, message } = body;
			throw new RSPCError(status_code, message);
		} else if (body.type === 'response') {
			return this.transformer?.deserialize(operation, key, body.result) || body.result;
		} else if (body.type !== 'none') {
			throw new Error(`RSPC ReactNative doRequest received invalid body type '${body?.type}'`);
		}
	}
}

type NonLibraryQueries = Exclude<Operations['queries'], { key: [any, LibraryArgs<any>] }> &
	Extract<Operations['queries'], { key: [any] }>;
type NonLibraryQuery<K extends string> = Extract<NonLibraryQueries, { key: [K] | [K, any] }>;
type NonLibraryQueryKey = NonLibraryQueries['key'][0];
type NonLibraryQueryResult<K extends NonLibraryQueryKey> = NonLibraryQuery<K>['result'];

export function useBridgeQuery<K extends NonLibraryQueries['key']>(
	key: K,
	options?: UseQueryOptions<NonLibraryQueryResult<K[0]>, RSPCError>
): UseQueryResult<NonLibraryQueryResult<K[0]>, RSPCError> {
	// @ts-ignore
	return rspc.useQuery(key, options);
}

type LibraryQueries = Extract<Operations['queries'], { key: [string, LibraryArgs<any>] }>;
type LibraryQuery<K extends string> = Extract<LibraryQueries, { key: [K, any] }>;
type LibraryQueryKey = LibraryQueries['key'][0];
type LibraryQueryArgs<K extends string> = LibraryQuery<K>['key'][1] extends LibraryArgs<infer A>
	? A
	: never;
type LibraryQueryResult<K extends string> = LibraryQuery<K>['result'];

export function useLibraryQuery<K extends LibraryQueryKey>(
	key: LibraryQueryArgs<K> extends null | undefined ? [K] : [K, LibraryQueryArgs<K>],
	options?: UseQueryOptions<LibraryQueryResult<K>, RSPCError>
): UseQueryResult<LibraryQueryResult<K>, RSPCError> {
	const store = useSnapshot(libraryStore);
	const library_id = store.currentLibraryUuid;
	if (!library_id) throw new Error(`Attempted to do library query with no library set!`);
	// @ts-ignore
	return rspc.useQuery([key[0], { library_id: library_id || '', arg: key[1] || null }], options);
}

type LibraryMutations = Extract<Operations['mutations'], { key: [string, LibraryArgs<any>] }>;
type LibraryMutation<K extends LibraryMutationKey> = Extract<LibraryMutations, { key: [K, any] }>;
type LibraryMutationKey = LibraryMutations['key'][0];
type LibraryMutationArgs<K extends LibraryMutationKey> =
	LibraryMutation<K>['key'][1] extends LibraryArgs<infer A> ? A : never;
type LibraryMutationResult<K extends LibraryMutationKey> = LibraryMutation<K>['result'];
export function useLibraryMutation<K extends LibraryMutationKey>(
	key: K,
	options?: UseMutationOptions<LibraryMutationResult<K>, RSPCError>
) {
	const ctx = rspc.useContext();
	const store = useSnapshot(libraryStore);
	const library_id = store.currentLibraryUuid;
	if (!library_id) throw new Error(`Attempted to do library query with no library set!`);

	// @ts-ignore
	return _useMutation<LibraryMutationResult<K>, RSPCError, LibraryMutationArgs<K>>(
		async (data) => ctx.client.mutation([key, { library_id: library_id || '', arg: data || null }]),
		{
			...options,
			context: rspc.ReactQueryContext
		}
	);
}

type NonLibraryMutations = Exclude<Operations['mutations'], { key: [any, LibraryArgs<any>] }>;
type NonLibraryMutation<K extends NonLibraryMutationKey> = Extract<
	NonLibraryMutations,
	{ key: [K] | [K, any] }
>;
type NonLibraryMutationKey = NonLibraryMutations['key'][0];
type NonLibraryMutationArgs<K extends NonLibraryMutationKey> = NonLibraryMutation<K>['key'][1];
type NonLibraryMutationResult<K extends NonLibraryMutationKey> = NonLibraryMutation<K>['result'];
export function useBridgeMutation<K extends NonLibraryMutationKey>(
	key: K,
	options?: UseMutationOptions<NonLibraryMutationResult<K>, RSPCError>
): UseMutationResult<NonLibraryMutationResult<K>, RSPCError, NonLibraryMutationArgs<K>> {
	// @ts-ignore
	return rspc.useMutation(key, options);
}

export function useInvalidateQuery() {
	const context = rspc.useContext();
	rspc.useSubscription(['invalidateQuery'], {
		onNext: (invalidateOperation) => {
			const key = [invalidateOperation.key];
			if (invalidateOperation.arg !== null) {
				key.concat(invalidateOperation.arg);
			}
			context.queryClient.invalidateQueries(key);
		}
	});
}
