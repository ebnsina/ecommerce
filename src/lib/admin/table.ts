import { tableFeatures, rowSelectionFeature } from '@tanstack/svelte-table';

/**
 * The feature set every admin list runs on.
 *
 * TanStack v9 takes the enabled features as a type parameter, so the shared
 * value has to live somewhere both the table component and the pages that
 * declare columns can import — otherwise every `ColumnDef` on every list page
 * has to say `any` for a type that is the same on all of them.
 */
export const adminTableFeatures = tableFeatures({ rowSelectionFeature });

export type AdminTableFeatures = typeof adminTableFeatures;
