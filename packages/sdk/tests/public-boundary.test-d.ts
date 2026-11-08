/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Checks the public source boundary and retained mechanism types without loading dist artifacts.
 */

import * as Root from "../src/index.js";
import type * as Types from "../src/types.js";
import * as Api from "../src/fabric/api/index.js";

/**
 * Requires a compile-time assertion to resolve to literal true.
 */
type Expect<Value extends true> = Value;

/**
 * Compares types without widening their literal or readonly contracts.
 */
type IsExactly<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;

/**
 * Checks structural assignability without executing a runtime callback.
 */
type IsAssignable<From, To> = From extends To ? true : false;

/**
 * References independent mechanisms which remain available through the root.
 */
export type RetainedPublicMechanisms = readonly [
  typeof Root.createApiClient,
  typeof Root.createMiaixzSessionManager,
  typeof Root.createMiaixzPersistentSessionStorage,
  typeof Root.MiaixzConfigStore,
  typeof Root.defineMiaixzConfig,
  typeof Root.loadMiaixzConfig,
  typeof Root.getMiaixzServiceEndpoint,
  typeof Root.MiaixzMemoryStorage,
  typeof Root.MiaixzNamespacedStorage,
  typeof Root.readMiaixzVersionedValue,
  typeof Root.writeMiaixzVersionedValue,
  typeof Root.createMiaixzAppearanceManager,
  typeof Root.createMiaixzI18n,
  typeof Root.createMiaixzMessageLoader,
  typeof Root.defineLocale,
  typeof Root.createMiaixzEventBus,
  typeof Root.createMiaixzGrantSet,
  typeof Root.createMiaixzFileClient,
  typeof Root.saveMiaixzBlob,
  typeof Root.formatMiaixzBytes,
  typeof Root.isRecord,
  typeof Root.createMiaixzDirectHostBridge,
  typeof Root.createMiaixzPostMessageHost,
  typeof Root.createMiaixzPostMessageChildBridge,
  typeof Root.VERSION,
  typeof Root.MIAIXZ_MODULE_PROTOCOL_VERSION,
];

/**
 * Keeps generic transport, persistence, identity-summary, and display contracts public.
 */
export type RetainedPublicContracts = readonly [
  Root.MiaixzApiClient,
  Root.MiaixzApiClientOptions,
  Root.MiaixzRequestOptions,
  Root.MiaixzResponseParser<unknown>,
  Root.MiaixzHttpResponse<unknown>,
  Root.MiaixzApiTelemetryHooks,
  Root.MiaixzRequestBodySummary,
  Root.MiaixzTokenProvider,
  Root.MiaixzAuthorizationProvider,
  Root.MiaixzContextHeadersProvider,
  Root.MiaixzCsrfOptions,
  Root.MiaixzApiProblem,
  Root.MiaixzEntity,
  Root.MiaixzIdentifier,
  Root.MiaixzTimestamp,
  Root.MiaixzSdkConfig,
  Root.MiaixzEnvironment,
  Root.MiaixzFeatureValue,
  Root.MiaixzSession,
  Root.MiaixzSessionManagerOptions,
  Root.MiaixzSessionStatus,
  Root.MiaixzPersistentSessionStorage,
  Root.MiaixzKeyValueStorage,
  Root.MiaixzStorageScope,
  Root.MiaixzStorageMigration,
  Root.MiaixzVersionedValue<unknown>,
  Root.MiaixzAppearanceManagerOptions,
  Root.MiaixzAppearanceSettings,
  Root.MiaixzAppearancePayload,
  Root.MiaixzI18nOptions,
  Root.MiaixzLocaleDefinition,
  Root.MiaixzMessages,
  Root.MiaixzGrantSnapshot,
  Root.MiaixzPermissionCode,
  Root.MiaixzSdkEventMap,
  Root.MiaixzEventEnvelope,
  Root.MiaixzFileDescriptor,
  Root.MiaixzUploadResult,
  Root.MiaixzUserSummary,
  Root.MiaixzPage<{ readonly id: string }>,
  Root.MiaixzPagination,
  Root.MiaixzModuleManifest,
  Root.MiaixzBridgeEnvelope,
  Root.MiaixzHttpErrorDetails,
  Root.MiaixzHttpErrorMapper,
  Types.MiaixzApiProblem,
  Types.MiaixzSdkConfig,
  Types.MiaixzUserSummary,
  Types.MiaixzPage<{ readonly id: string }>,
  Types.MiaixzPagination,
  Types.MiaixzFileDescriptor,
  Types.MiaixzBaseFontSize,
  Types.MiaixzRadiusScale,
  Types.MiaixzShellLayout,
  Api.MiaixzApiClient,
  Api.MiaixzApiClientOptions,
  Api.MiaixzHttpResponse<unknown>,
  Api.MiaixzHttpErrorDetails,
  Api.MiaixzHttpErrorMapper,
];

const collection = [{ value: "compact" }, { value: "standard" }] as const;
const selected = Root.resolveCollectionValue(collection, "compact");

/**
 * Infers values only from the readonly collection, retaining their complete literal union.
 */
type CollectionLiteralIsRetained = Expect<IsExactly<typeof selected, "compact" | "standard">>;

/**
 * Rejects non-string candidates rather than widening the collection's value type.
 * @ts-expect-error The candidate parameter accepts strings only. */
Root.resolveCollectionValue(collection, 1);

/**
 * Rejects numeric collection values.
 * @ts-expect-error Collection values must extend string. */
Root.resolveCollectionValue([{ value: 1 }], "1");

const original = { count: 1, nested: { ready: true }, rows: [{ id: "item" }] };
const cloned = Root.cloneMiaixzJsonValue(original);
const literalClone = Root.cloneMiaixzJsonValue({ mode: "compact" } as const);
const frozen = Root.freezeMiaixzJsonValue(cloned);
const frozenUndefined = Root.freezeMiaixzJsonValue(undefined);
const merged = Root.mergeMiaixzJsonValue(cloned, { count: 2 });

/**
 * Preserves the caller's original value type without adding readonly modifiers.
 */
type CloneRetainsValueType = Expect<IsExactly<typeof cloned, typeof original>>;

/**
 * Preserves readonly literal input types when the caller already supplied them.
 */
type CloneRetainsLiteralType = Expect<IsExactly<typeof literalClone, { readonly mode: "compact" }>>;

/**
 * Exposes the exact recursively readonly projection declared by the freeze mechanism.
 */
type FreezeReturnsDeepReadonly = Expect<
  IsExactly<typeof frozen, Root.MiaixzDeepReadonly<typeof original>>
>;

/**
 * Keeps functions callable under the public readonly projection.
 */
type ReadonlyPreservesFunction = Expect<
  IsExactly<Root.MiaixzDeepReadonly<(value: number) => string>, (value: number) => string>
>;

/**
 * Does not mistake freezing for JSON validation.
 */
type FreezeAllowsUndefined = Expect<IsExactly<typeof frozenUndefined, undefined>>;

/**
 * Keeps merge results unknown until the consumer validates their domain type.
 */
type MergeReturnsUnknown = Expect<IsExactly<typeof merged, unknown>>;

/**
 * Rejects writes through a deeply readonly object result.
 * @ts-expect-error Nested properties returned by freeze are readonly. */
frozen.nested.ready = false;

/**
 * Rejects mutation through the readonly array projection.
 * @ts-expect-error Frozen arrays do not expose mutable push operations. */
frozen.rows.push({ id: "another" });

/**
 * Requires consumers to narrow unknown merge results.
 * @ts-expect-error No domain fields can be read from an unknown merge result. */
merged.count;

/**
 * Does not offer an invented generic domain return assertion for merge.
 * @ts-expect-error Merge has no caller-selected domain type parameter. */
Root.mergeMiaixzJsonValue<{ readonly count: number }>({}, { count: 1 });

/**
 * Accepts caller-owned error construction without a project error dependency.
 */
type JsonThrowingCallbackIsAccepted = Expect<
  IsAssignable<
    { readonly onInvalid: (path: string, expectation: string) => never },
    Root.MiaixzJsonOptions
  >
>;

/**
 * Rejects callbacks which claim that invalid JSON can return normally.
 */
type JsonReturningCallbackIsRejected = Expect<
  IsExactly<IsAssignable<{ readonly onInvalid: () => undefined }, Root.MiaixzJsonOptions>, false>
>;

const csvRows = [
  ["Name", 1],
  ["Example", 2],
] as const;
const csvLf = Root.serializeMiaixzCsv(csvRows, "\n");
const csvCrlf = Root.serializeMiaixzCsv(csvRows, "\r\n");

/**
 * Accepts readonly string/number rows and both explicit supported line separators.
 */
type CsvReturnsString = Expect<IsExactly<typeof csvLf | typeof csvCrlf, string>>;

/**
 * Requires the consumer to choose a row separator.
 * @ts-expect-error CSV has no implicit line-ending default. */
Root.serializeMiaixzCsv(csvRows);

/**
 * Rejects an unsupported row separator.
 * @ts-expect-error CSV accepts LF or CRLF only. */
Root.serializeMiaixzCsv(csvRows, "\r");

/**
 * Rejects cell types outside the published string/number contract.
 * @ts-expect-error Boolean cells are not part of the public CSV input type. */
Root.serializeMiaixzCsv([[true]], "\n");

/**
 * Exposes the same transport option contract through the root and API source entry.
 */
type ApiOptionsRemainPublic = Expect<
  IsExactly<Api.MiaixzApiClientOptions, Root.MiaixzApiClientOptions>
>;

/**
 * Preserves generic payloads without a fixed business envelope.
 */
type HttpResponseRetainsPayload = Expect<
  IsExactly<Api.MiaixzHttpResponse<{ readonly id: string }>["data"], { readonly id: string }>
>;

declare const transport: Api.MiaixzApiClient;
const emptyPost = transport.post<void>("/items", undefined, { responseType: "void" });

/**
 * Keeps explicit void POST responses available without application response unwrapping.
 */
type VoidPostRemainsPublic = Expect<
  IsExactly<typeof emptyPost, Promise<Api.MiaixzHttpResponse<void>>>
>;

/**
 * Preserves typed runtime response parsers, including void responses.
 */
type ResponseParserRemainsGeneric = Expect<
  IsExactly<ReturnType<Api.MiaixzResponseParser<void>>, void>
>;

/**
 * Removes application envelope configuration from the request contract.
 */
type RequestHasNoEnvelopeMode = Expect<
  IsExactly<"envelope" extends keyof Api.MiaixzRequestOptions ? true : false, false>
>;

/**
 * Retains the generic unsuccessful-response detail adapter through both public entries.
 */
type ErrorMapperRemainsPublic = Expect<
  IsExactly<Api.MiaixzHttpErrorMapper, Root.MiaixzHttpErrorMapper>
>;

/**
 * Supplies untrusted response bodies to the adapter without a domain assertion.
 */
type ErrorMapperBodyIsUnknown = Expect<
  IsExactly<Parameters<Api.MiaixzHttpErrorMapper>[0], unknown>
>;

/**
 * Keeps transport status readonly at the error-detail boundary.
 */
type ErrorMapperStatusIsReadonly = Expect<
  IsExactly<Parameters<Api.MiaixzHttpErrorMapper>[1], Readonly<{ status: number }>>
>;

/**
 * Keeps unsuccessful-response mapping synchronous.
 */
type AsyncErrorMapperIsRejected = Expect<
  IsExactly<IsAssignable<() => Promise<{ code: string }>, Api.MiaixzHttpErrorMapper>, false>
>;

/**
 * Keeps generic problem details available from the general types source entry.
 */
type ProblemTypeRemainsPublic = Expect<IsExactly<Types.MiaixzApiProblem, Root.MiaixzApiProblem>>;

/**
 * Removes the project context event while retaining independent mechanism signals.
 */
type EventsHaveNoFixedContext = Expect<
  IsExactly<"context:changed" extends keyof Root.MiaixzSdkEventMap ? true : false, false>
>;

/**
 * Defines a consumer-owned neutral context for the generic Bridge contracts.
 */
interface PublicContext {
  readonly label: string;
  readonly mode: "compact" | "standard";
}

/**
 * Keeps concrete contexts typed through Host bridge reads.
 */
type BridgeRetainsConcreteContext = Expect<
  IsExactly<
    ReturnType<Root.MiaixzHostBridge<PublicContext>["getContext"]>,
    Promise<Readonly<PublicContext>>
  >
>;

/**
 * Keeps concrete contexts typed through injected Host providers.
 */
type AdapterRetainsConcreteContext = Expect<
  IsExactly<
    ReturnType<NonNullable<Root.MiaixzHostAdapter<PublicContext>["getContext"]>>,
    Promise<Readonly<PublicContext>>
  >
>;

/**
 * Keeps Direct context parsing owned by the consumer.
 */
type DirectParserRetainsConcreteContext = Expect<
  IsExactly<
    ReturnType<NonNullable<Root.MiaixzDirectHostBridgeOptions<PublicContext>["parseContext"]>>,
    Readonly<PublicContext>
  >
>;

/**
 * Keeps the Host's context parser independently typed.
 */
type HostParserRetainsConcreteContext = Expect<
  IsExactly<
    ReturnType<NonNullable<Root.MiaixzPostMessageHostOptions<PublicContext>["parseContext"]>>,
    Readonly<PublicContext>
  >
>;

/**
 * Keeps the Child's context parser independently typed.
 */
type ChildParserRetainsConcreteContext = Expect<
  IsExactly<
    ReturnType<NonNullable<Root.MiaixzPostMessageChildOptions<PublicContext>["parseContext"]>>,
    Readonly<PublicContext>
  >
>;

/**
 * Rejects asynchronous parsers for a concrete context whose synchronous shape is required.
 */
type AsyncConcreteContextParserIsRejected = Expect<
  IsExactly<
    IsAssignable<
      (value: unknown) => Promise<PublicContext>,
      NonNullable<Root.MiaixzPostMessageChildOptions<PublicContext>["parseContext"]>
    >,
    false
  >
>;

/**
 * Keeps the default Bridge read contract consumer-neutral.
 */
type BridgeDefaultContextRemainsUnknown = Expect<
  IsExactly<ReturnType<Root.MiaixzHostBridge["getContext"]>, Promise<Readonly<unknown>>>
>;

declare const defaultContext: Awaited<ReturnType<Root.MiaixzHostBridge["getContext"]>>;

/**
 * Excludes fixed application fields from the default context shape.
 * @ts-expect-error A default generic Bridge does not declare tenantId. */
type DefaultContextHasNoTenant = typeof defaultContext.tenantId;

/**
 * Excludes a project-owned mock error from public library types.
 * @ts-expect-error Mock contract errors belong to the consuming application. */
type NoProjectMockContractError = Root.MiaixzMockContractError;

/**
 * Rejects the retired Root export isMiaixzApiEnvelope.
 * @ts-expect-error isMiaixzApiEnvelope is not a public library export. */
type RemovedRootisMiaixzApiEnvelope = typeof Root.isMiaixzApiEnvelope;

/**
 * Rejects the retired Root export isMiaixzApiSuccess.
 * @ts-expect-error isMiaixzApiSuccess is not a public library export. */
type RemovedRootisMiaixzApiSuccess = typeof Root.isMiaixzApiSuccess;

/**
 * Rejects the retired Root export RestGatewayClient.
 * @ts-expect-error RestGatewayClient is not a public library export. */
type RemovedRootRestGatewayClient = Root.RestGatewayClient;

/**
 * Rejects the retired Root export RestSigner.
 * @ts-expect-error RestSigner is not a public library export. */
type RemovedRootRestSigner = Root.RestSigner;

/**
 * Rejects the retired Root export Signer.
 * @ts-expect-error Signer is not a public library export. */
type RemovedRootSigner = Root.Signer;

/**
 * Rejects the retired Root export unwrapMiaixzData.
 * @ts-expect-error unwrapMiaixzData is not a public library export. */
type RemovedRootunwrapMiaixzData = typeof Root.unwrapMiaixzData;

/**
 * Rejects the retired Root export MiaixzEnvelopeMode.
 * @ts-expect-error MiaixzEnvelopeMode is not a public library export. */
type RemovedRootMiaixzEnvelopeMode = Root.MiaixzEnvelopeMode;

/**
 * Rejects the retired Root export RestGatewayClientOptions.
 * @ts-expect-error RestGatewayClientOptions is not a public library export. */
type RemovedRootRestGatewayClientOptions = Root.RestGatewayClientOptions;

/**
 * Rejects the retired Root export RestGatewayParameters.
 * @ts-expect-error RestGatewayParameters is not a public library export. */
type RemovedRootRestGatewayParameters = Root.RestGatewayParameters;

/**
 * Rejects the retired Root export RestGatewayRequestInput.
 * @ts-expect-error RestGatewayRequestInput is not a public library export. */
type RemovedRootRestGatewayRequestInput = Root.RestGatewayRequestInput<unknown>;

/**
 * Rejects the retired Root export RestJsonValue.
 * @ts-expect-error RestJsonValue is not a public library export. */
type RemovedRootRestJsonValue = Root.RestJsonValue;

/**
 * Rejects the retired Root export RestSignatureAuth.
 * @ts-expect-error RestSignatureAuth is not a public library export. */
type RemovedRootRestSignatureAuth = Root.RestSignatureAuth;

/**
 * Rejects the retired Root export RestSignInput.
 * @ts-expect-error RestSignInput is not a public library export. */
type RemovedRootRestSignInput = Root.RestSignInput;

/**
 * Rejects the retired Root export createMiaixzContextStore.
 * @ts-expect-error createMiaixzContextStore is not a public library export. */
type RemovedRootcreateMiaixzContextStore = typeof Root.createMiaixzContextStore;

/**
 * Rejects the retired Root export isMiaixzRuntimeContext.
 * @ts-expect-error isMiaixzRuntimeContext is not a public library export. */
type RemovedRootisMiaixzRuntimeContext = typeof Root.isMiaixzRuntimeContext;

/**
 * Rejects the retired Root export MiaixzContextStore.
 * @ts-expect-error MiaixzContextStore is not a public library export. */
type RemovedRootMiaixzContextStore = Root.MiaixzContextStore;

/**
 * Rejects the retired Root export miaixzContextToHeaders.
 * @ts-expect-error miaixzContextToHeaders is not a public library export. */
type RemovedRootmiaixzContextToHeaders = typeof Root.miaixzContextToHeaders;

/**
 * Rejects the retired Root export MiaixzContextStoreOptions.
 * @ts-expect-error MiaixzContextStoreOptions is not a public library export. */
type RemovedRootMiaixzContextStoreOptions = Root.MiaixzContextStoreOptions;

/**
 * Rejects the retired Root export createMiaixzSdk.
 * @ts-expect-error createMiaixzSdk is not a public library export. */
type RemovedRootcreateMiaixzSdk = typeof Root.createMiaixzSdk;

/**
 * Rejects the retired Root export MiaixzAppearanceScope.
 * @ts-expect-error MiaixzAppearanceScope is not a public library export. */
type RemovedRootMiaixzAppearanceScope = Root.MiaixzAppearanceScope;

/**
 * Rejects the retired Root export MiaixzAuthMode.
 * @ts-expect-error MiaixzAuthMode is not a public library export. */
type RemovedRootMiaixzAuthMode = Root.MiaixzAuthMode;

/**
 * Rejects the retired Root export MiaixzBearerSdk.
 * @ts-expect-error MiaixzBearerSdk is not a public library export. */
type RemovedRootMiaixzBearerSdk = Root.MiaixzBearerSdk;

/**
 * Rejects the retired Root export MiaixzBearerSdkOptions.
 * @ts-expect-error MiaixzBearerSdkOptions is not a public library export. */
type RemovedRootMiaixzBearerSdkOptions = Root.MiaixzBearerSdkOptions;

/**
 * Rejects the retired Root export MiaixzCookieSdk.
 * @ts-expect-error MiaixzCookieSdk is not a public library export. */
type RemovedRootMiaixzCookieSdk = Root.MiaixzCookieSdk;

/**
 * Rejects the retired Root export MiaixzCookieSdkOptions.
 * @ts-expect-error MiaixzCookieSdkOptions is not a public library export. */
type RemovedRootMiaixzCookieSdkOptions = Root.MiaixzCookieSdkOptions;

/**
 * Rejects the retired Root export MiaixzSdk.
 * @ts-expect-error MiaixzSdk is not a public library export. */
type RemovedRootMiaixzSdk = Root.MiaixzSdk;

/**
 * Rejects the retired Root export MiaixzSdkBase.
 * @ts-expect-error MiaixzSdkBase is not a public library export. */
type RemovedRootMiaixzSdkBase = Root.MiaixzSdkBase;

/**
 * Rejects the retired Root export MiaixzSdkCommonOptions.
 * @ts-expect-error MiaixzSdkCommonOptions is not a public library export. */
type RemovedRootMiaixzSdkCommonOptions = Root.MiaixzSdkCommonOptions;

/**
 * Rejects the retired Root export MiaixzSdkEventOptions.
 * @ts-expect-error MiaixzSdkEventOptions is not a public library export. */
type RemovedRootMiaixzSdkEventOptions = Root.MiaixzSdkEventOptions;

/**
 * Rejects the retired Root export MiaixzSdkOptions.
 * @ts-expect-error MiaixzSdkOptions is not a public library export. */
type RemovedRootMiaixzSdkOptions = Root.MiaixzSdkOptions;

/**
 * Rejects the retired Root export MiaixzApiEnvelope.
 * @ts-expect-error MiaixzApiEnvelope is not a public library export. */
type RemovedRootMiaixzApiEnvelope = Root.MiaixzApiEnvelope<unknown>;

/**
 * Rejects the retired Root export MiaixzAudit.
 * @ts-expect-error MiaixzAudit is not a public library export. */
type RemovedRootMiaixzAudit = Root.MiaixzAudit;

/**
 * Rejects the retired Root export MiaixzDepartmentSummary.
 * @ts-expect-error MiaixzDepartmentSummary is not a public library export. */
type RemovedRootMiaixzDepartmentSummary = Root.MiaixzDepartmentSummary;

/**
 * Rejects the retired Root export MiaixzLogicalStatus.
 * @ts-expect-error MiaixzLogicalStatus is not a public library export. */
type RemovedRootMiaixzLogicalStatus = Root.MiaixzLogicalStatus;

/**
 * Rejects the retired Root export MiaixzOrganizationSummary.
 * @ts-expect-error MiaixzOrganizationSummary is not a public library export. */
type RemovedRootMiaixzOrganizationSummary = Root.MiaixzOrganizationSummary;

/**
 * Rejects the retired Root export MiaixzPageQuery.
 * @ts-expect-error MiaixzPageQuery is not a public library export. */
type RemovedRootMiaixzPageQuery = Root.MiaixzPageQuery;

/**
 * Rejects the retired Root export MiaixzRuntimeContext.
 * @ts-expect-error MiaixzRuntimeContext is not a public library export. */
type RemovedRootMiaixzRuntimeContext = Root.MiaixzRuntimeContext;

/**
 * Rejects the retired Root export MiaixzSpaceState.
 * @ts-expect-error MiaixzSpaceState is not a public library export. */
type RemovedRootMiaixzSpaceState = Root.MiaixzSpaceState;

/**
 * Rejects the retired Root export MiaixzSpaceSummary.
 * @ts-expect-error MiaixzSpaceSummary is not a public library export. */
type RemovedRootMiaixzSpaceSummary = Root.MiaixzSpaceSummary;

/**
 * Rejects the retired Root export MiaixzTenantState.
 * @ts-expect-error MiaixzTenantState is not a public library export. */
type RemovedRootMiaixzTenantState = Root.MiaixzTenantState;

/**
 * Rejects the retired Root export MiaixzTenantSummary.
 * @ts-expect-error MiaixzTenantSummary is not a public library export. */
type RemovedRootMiaixzTenantSummary = Root.MiaixzTenantSummary;

/**
 * Rejects the retired Root export MiaixzUser.
 * @ts-expect-error MiaixzUser is not a public library export. */
type RemovedRootMiaixzUser = Root.MiaixzUser;

/**
 * Rejects the retired Types export MiaixzApiEnvelope.
 * @ts-expect-error MiaixzApiEnvelope is not a public library export. */
type RemovedTypesMiaixzApiEnvelope = Types.MiaixzApiEnvelope<unknown>;

/**
 * Rejects the retired Types export MiaixzAudit.
 * @ts-expect-error MiaixzAudit is not a public library export. */
type RemovedTypesMiaixzAudit = Types.MiaixzAudit;

/**
 * Rejects the retired Types export MiaixzLogicalStatus.
 * @ts-expect-error MiaixzLogicalStatus is not a public library export. */
type RemovedTypesMiaixzLogicalStatus = Types.MiaixzLogicalStatus;

/**
 * Rejects the retired Types export MiaixzRuntimeContext.
 * @ts-expect-error MiaixzRuntimeContext is not a public library export. */
type RemovedTypesMiaixzRuntimeContext = Types.MiaixzRuntimeContext;

/**
 * Rejects the retired Types export MiaixzDepartmentSummary.
 * @ts-expect-error MiaixzDepartmentSummary is not a public library export. */
type RemovedTypesMiaixzDepartmentSummary = Types.MiaixzDepartmentSummary;

/**
 * Rejects the retired Types export MiaixzOrganizationSummary.
 * @ts-expect-error MiaixzOrganizationSummary is not a public library export. */
type RemovedTypesMiaixzOrganizationSummary = Types.MiaixzOrganizationSummary;

/**
 * Rejects the retired Types export MiaixzPageQuery.
 * @ts-expect-error MiaixzPageQuery is not a public library export. */
type RemovedTypesMiaixzPageQuery = Types.MiaixzPageQuery;

/**
 * Rejects the retired Types export MiaixzSpaceState.
 * @ts-expect-error MiaixzSpaceState is not a public library export. */
type RemovedTypesMiaixzSpaceState = Types.MiaixzSpaceState;

/**
 * Rejects the retired Types export MiaixzSpaceSummary.
 * @ts-expect-error MiaixzSpaceSummary is not a public library export. */
type RemovedTypesMiaixzSpaceSummary = Types.MiaixzSpaceSummary;

/**
 * Rejects the retired Types export MiaixzTenantState.
 * @ts-expect-error MiaixzTenantState is not a public library export. */
type RemovedTypesMiaixzTenantState = Types.MiaixzTenantState;

/**
 * Rejects the retired Types export MiaixzTenantSummary.
 * @ts-expect-error MiaixzTenantSummary is not a public library export. */
type RemovedTypesMiaixzTenantSummary = Types.MiaixzTenantSummary;

/**
 * Rejects the retired Types export MiaixzUser.
 * @ts-expect-error MiaixzUser is not a public library export. */
type RemovedTypesMiaixzUser = Types.MiaixzUser;

/**
 * Rejects the retired Api export MiaixzEnvelopeMode.
 * @ts-expect-error MiaixzEnvelopeMode is not a public library export. */
type RemovedApiMiaixzEnvelopeMode = Api.MiaixzEnvelopeMode;

/**
 * Rejects the retired Api export isMiaixzApiEnvelope.
 * @ts-expect-error isMiaixzApiEnvelope is not a public library export. */
type RemovedApiisMiaixzApiEnvelope = typeof Api.isMiaixzApiEnvelope;

/**
 * Rejects the retired Api export isMiaixzApiSuccess.
 * @ts-expect-error isMiaixzApiSuccess is not a public library export. */
type RemovedApiisMiaixzApiSuccess = typeof Api.isMiaixzApiSuccess;

/**
 * Rejects the retired Api export unwrapMiaixzData.
 * @ts-expect-error unwrapMiaixzData is not a public library export. */
type RemovedApiunwrapMiaixzData = typeof Api.unwrapMiaixzData;

/**
 * Rejects the retired Api export RestGatewayClient.
 * @ts-expect-error RestGatewayClient is not a public library export. */
type RemovedApiRestGatewayClient = Api.RestGatewayClient;

/**
 * Rejects the retired Api export RestSigner.
 * @ts-expect-error RestSigner is not a public library export. */
type RemovedApiRestSigner = Api.RestSigner;

/**
 * Rejects the retired Api export Signer.
 * @ts-expect-error Signer is not a public library export. */
type RemovedApiSigner = Api.Signer;

/**
 * Rejects the retired Api export RestGatewayClientOptions.
 * @ts-expect-error RestGatewayClientOptions is not a public library export. */
type RemovedApiRestGatewayClientOptions = Api.RestGatewayClientOptions;

/**
 * Rejects the retired Api export RestGatewayParameters.
 * @ts-expect-error RestGatewayParameters is not a public library export. */
type RemovedApiRestGatewayParameters = Api.RestGatewayParameters;

/**
 * Rejects the retired Api export RestGatewayRequestInput.
 * @ts-expect-error RestGatewayRequestInput is not a public library export. */
type RemovedApiRestGatewayRequestInput = Api.RestGatewayRequestInput<unknown>;

/**
 * Rejects the retired Api export RestJsonValue.
 * @ts-expect-error RestJsonValue is not a public library export. */
type RemovedApiRestJsonValue = Api.RestJsonValue;

/**
 * Rejects the retired Api export RestSignatureAuth.
 * @ts-expect-error RestSignatureAuth is not a public library export. */
type RemovedApiRestSignatureAuth = Api.RestSignatureAuth;

/**
 * Rejects the retired Api export RestSignInput.
 * @ts-expect-error RestSignInput is not a public library export. */
type RemovedApiRestSignInput = Api.RestSignInput;

/**
 * Rejects runtime reintroductions of retired Root symbols, including type-only class checks.
 */
type RootHasNoRetiredRuntimeExports = Expect<
  IsExactly<
    Extract<
      | "isMiaixzApiEnvelope"
      | "isMiaixzApiSuccess"
      | "RestGatewayClient"
      | "RestSigner"
      | "Signer"
      | "unwrapMiaixzData"
      | "createMiaixzContextStore"
      | "isMiaixzRuntimeContext"
      | "MiaixzContextStore"
      | "miaixzContextToHeaders"
      | "createMiaixzSdk"
      | "MiaixzMockContractError",
      keyof typeof Root
    >,
    never
  >
>;

/**
 * Rejects runtime reintroductions of retired Api symbols, including type-only class checks.
 */
type ApiHasNoRetiredRuntimeExports = Expect<
  IsExactly<
    Extract<
      | "isMiaixzApiEnvelope"
      | "isMiaixzApiSuccess"
      | "unwrapMiaixzData"
      | "RestGatewayClient"
      | "RestSigner"
      | "Signer",
      keyof typeof Api
    >,
    never
  >
>;
/**
 * Collects positive compile-time invariants; negative source references are checked individually.
 */
export type PublicBoundaryContractAssertions =
  | CollectionLiteralIsRetained
  | CloneRetainsValueType
  | CloneRetainsLiteralType
  | FreezeReturnsDeepReadonly
  | ReadonlyPreservesFunction
  | FreezeAllowsUndefined
  | MergeReturnsUnknown
  | JsonThrowingCallbackIsAccepted
  | JsonReturningCallbackIsRejected
  | CsvReturnsString
  | ApiOptionsRemainPublic
  | HttpResponseRetainsPayload
  | ResponseParserRemainsGeneric
  | VoidPostRemainsPublic
  | RequestHasNoEnvelopeMode
  | ErrorMapperRemainsPublic
  | ErrorMapperBodyIsUnknown
  | ErrorMapperStatusIsReadonly
  | AsyncErrorMapperIsRejected
  | ProblemTypeRemainsPublic
  | EventsHaveNoFixedContext
  | BridgeRetainsConcreteContext
  | AdapterRetainsConcreteContext
  | DirectParserRetainsConcreteContext
  | HostParserRetainsConcreteContext
  | ChildParserRetainsConcreteContext
  | AsyncConcreteContextParserIsRejected
  | BridgeDefaultContextRemainsUnknown
  | RootHasNoRetiredRuntimeExports
  | ApiHasNoRetiredRuntimeExports;
