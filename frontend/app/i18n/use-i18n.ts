// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { useSyncExternalStore } from "react";
import { getLocale, subscribeLocale, t } from "./core";

/** Subscribe to locale changes so React trees re-render after language switches. */
export function useT(): typeof t {
    useSyncExternalStore(subscribeLocale, getLocale, getLocale);
    return t;
}
