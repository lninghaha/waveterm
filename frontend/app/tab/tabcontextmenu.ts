// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { getLocale, t } from "@/app/i18n/core";
import { getOrefMetaKeyAtom, globalStore, recordTEvent } from "@/app/store/global";
import { TabRpcClient } from "@/app/store/wshrpcutil";
import { fireAndForget } from "@/util/util";
import { makeORef } from "../store/wos";
import type { TabEnv } from "./tab";

const FlagColors: { labelKey: string; value: string }[] = [
    { labelKey: "Green", value: "#58C142" },
    { labelKey: "Teal", value: "#00FFDB" },
    { labelKey: "Blue", value: "#429DFF" },
    { labelKey: "Purple", value: "#BF55EC" },
    { labelKey: "Red", value: "#FF453A" },
    { labelKey: "Orange", value: "#FF9500" },
    { labelKey: "Yellow", value: "#FFE900" },
];

export function buildTabBarContextMenu(env: TabEnv): ContextMenuItem[] {
    const currentTabBar = globalStore.get(env.getSettingsKeyAtom("app:tabbar")) ?? "top";
    const tabBarSubmenu: ContextMenuItem[] = [
        {
            label: t("Top"),
            type: "checkbox",
            checked: currentTabBar === "top",
            click: () => fireAndForget(() => env.rpc.SetConfigCommand(TabRpcClient, { "app:tabbar": "top" })),
        },
        {
            label: t("Left"),
            type: "checkbox",
            checked: currentTabBar === "left",
            click: () => fireAndForget(() => env.rpc.SetConfigCommand(TabRpcClient, { "app:tabbar": "left" })),
        },
    ];
    return [{ label: t("Tab Bar Position"), type: "submenu", submenu: tabBarSubmenu }];
}

export function buildTabContextMenu(
    id: string,
    renameRef: React.RefObject<(() => void) | null>,
    onClose: (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null) => void,
    env: TabEnv
): ContextMenuItem[] {
    const menu: ContextMenuItem[] = [];
    menu.push(
        { label: t("Rename Tab"), click: () => renameRef.current?.() },
        {
            label: t("Copy TabId"),
            click: () => fireAndForget(() => navigator.clipboard.writeText(id)),
        },
        { type: "separator" }
    );
    const tabORef = makeORef("tab", id);
    const currentFlagColor = globalStore.get(getOrefMetaKeyAtom(tabORef, "tab:flagcolor")) ?? null;
    const flagSubmenu: ContextMenuItem[] = [
        {
            label: t("None"),
            type: "checkbox",
            checked: currentFlagColor == null,
            click: () =>
                fireAndForget(() =>
                    env.rpc.SetMetaCommand(TabRpcClient, { oref: tabORef, meta: { "tab:flagcolor": null } })
                ),
        },
        ...FlagColors.map((fc) => ({
            label: t(fc.labelKey),
            type: "checkbox" as const,
            checked: currentFlagColor === fc.value,
            click: () =>
                fireAndForget(() =>
                    env.rpc.SetMetaCommand(TabRpcClient, { oref: tabORef, meta: { "tab:flagcolor": fc.value } })
                ),
        })),
    ];
    menu.push({ label: t("Flag Tab"), type: "submenu", submenu: flagSubmenu }, { type: "separator" });
    const fullConfig = globalStore.get(env.atoms.fullConfigAtom);
    const backgrounds = fullConfig?.backgrounds ?? {};
    const bgKeys = Object.keys(backgrounds).filter((k) => backgrounds[k] != null);
    bgKeys.sort((a, b) => {
        const aOrder = backgrounds[a]["display:order"] ?? 0;
        const bOrder = backgrounds[b]["display:order"] ?? 0;
        return aOrder - bOrder;
    });
    if (bgKeys.length > 0) {
        const submenu: ContextMenuItem[] = [];
        const oref = makeORef("tab", id);
        submenu.push({
            label: t("Default"),
            click: () =>
                fireAndForget(async () => {
                    await env.rpc.SetMetaCommand(TabRpcClient, {
                        oref,
                        meta: { "bg:*": true, "tab:background": null },
                    });
                    env.rpc.ActivityCommand(TabRpcClient, { settabtheme: 1 }, { noresponse: true });
                    recordTEvent("action:settabtheme");
                }),
        });
        for (const bgKey of bgKeys) {
            const bg = backgrounds[bgKey];
            submenu.push({
                label: bg["display:name"] ?? bgKey,
                click: () =>
                    fireAndForget(async () => {
                        await env.rpc.SetMetaCommand(TabRpcClient, {
                            oref,
                            meta: { "bg:*": true, "tab:background": bgKey },
                        });
                        env.rpc.ActivityCommand(TabRpcClient, { settabtheme: 1 }, { noresponse: true });
                        recordTEvent("action:settabtheme");
                    }),
            });
        }
        menu.push({ label: t("Backgrounds"), type: "submenu", submenu }, { type: "separator" });
    }
    const currentLang = getLocale();
    const languageSubmenu: ContextMenuItem[] = [
        {
            label: t("English"),
            type: "checkbox",
            checked: currentLang === "en",
            click: () => fireAndForget(() => env.rpc.SetConfigCommand(TabRpcClient, { "app:language": "en" })),
        },
        {
            label: t("Simplified Chinese"),
            type: "checkbox",
            checked: currentLang === "zh-CN",
            click: () => fireAndForget(() => env.rpc.SetConfigCommand(TabRpcClient, { "app:language": "zh-CN" })),
        },
    ];
    menu.push(...buildTabBarContextMenu(env), { type: "separator" });
    menu.push({ label: t("Language"), type: "submenu", submenu: languageSubmenu }, { type: "separator" });
    menu.push({ label: t("Close Tab"), click: () => onClose(null) });
    return menu;
}
