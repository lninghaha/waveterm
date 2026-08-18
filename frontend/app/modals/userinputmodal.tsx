// Copyright 2025, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { useT } from "@/app/i18n/use-i18n";
import { Modal } from "@/app/modals/modal";
import { Markdown } from "@/element/markdown";
import { modalsModel } from "@/store/modalmodel";
import * as keyutil from "@/util/keyutil";
import { fireAndForget } from "@/util/util";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserInputService } from "../store/services";

const UserInputModal = (userInputRequest: UserInputRequest) => {
    const t = useT();
    const [responseText, setResponseText] = useState("");
    const [countdown, setCountdown] = useState(Math.floor(userInputRequest.timeoutms / 1000));
    const checkboxRef = useRef<HTMLInputElement>(null);

    const translatedTitle = userInputRequest.title ? t(userInputRequest.title) : "";
    const queryBody = userInputRequest.messageid
        ? t(userInputRequest.messageid, userInputRequest.params)
        : userInputRequest.querytext;

    const handleSendErrResponse = useCallback(() => {
        fireAndForget(() =>
            UserInputService.SendUserInputResponse({
                type: "userinputresp",
                requestid: userInputRequest.requestid,
                errormsg: "Canceled by the user",
            })
        );
        modalsModel.popModal();
    }, [userInputRequest]);

    const handleSendText = useCallback(() => {
        fireAndForget(() =>
            UserInputService.SendUserInputResponse({
                type: "userinputresp",
                requestid: userInputRequest.requestid,
                text: responseText,
                checkboxstat: checkboxRef?.current?.checked ?? false,
            })
        );
        modalsModel.popModal();
    }, [responseText, userInputRequest]);

    const handleSendConfirm = useCallback(
        (response: boolean) => {
            fireAndForget(() =>
                UserInputService.SendUserInputResponse({
                    type: "userinputresp",
                    requestid: userInputRequest.requestid,
                    confirm: response,
                    checkboxstat: checkboxRef?.current?.checked ?? false,
                })
            );
            modalsModel.popModal();
        },
        [userInputRequest]
    );

    const handleSubmit = useCallback(() => {
        switch (userInputRequest.responsetype) {
            case "text":
                handleSendText();
                break;
            case "confirm":
                handleSendConfirm(true);
                break;
        }
    }, [handleSendConfirm, handleSendText, userInputRequest.responsetype]);

    const handleKeyDown = useCallback(
        (waveEvent: WaveKeyboardEvent): boolean => {
            if (keyutil.checkKeyPressed(waveEvent, "Escape")) {
                handleSendErrResponse();
                return true;
            }
            if (keyutil.checkKeyPressed(waveEvent, "Enter")) {
                handleSubmit();
                return true;
            }
            return false;
        },
        [handleSendErrResponse, handleSubmit]
    );

    const queryText = useMemo(() => {
        if (userInputRequest.markdown) {
            return <Markdown text={queryBody} />;
        }
        return <span>{queryBody}</span>;
    }, [userInputRequest.markdown, queryBody]);

    const inputBox = useMemo(() => {
        if (userInputRequest.responsetype === "confirm") {
            return <></>;
        }
        return (
            <input
                type={userInputRequest.publictext ? "text" : "password"}
                onChange={(e) => setResponseText(e.target.value)}
                value={responseText}
                maxLength={400}
                className="resize-none bg-panel rounded-md border border-border py-1.5 pl-4 min-h-[30px] text-inherit cursor-text focus:ring-2 focus:ring-accent focus:outline-none"
                autoFocus={true}
                onKeyDown={(e) => keyutil.keydownWrapper(handleKeyDown)(e)}
            />
        );
    }, [userInputRequest.responsetype, userInputRequest.publictext, responseText, handleKeyDown, setResponseText]);

    const optionalCheckbox = useMemo(() => {
        if (userInputRequest.checkboxmsg == "") {
            return <></>;
        }
        return (
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                    <input
                        type="checkbox"
                        id={`uicheckbox-${userInputRequest.requestid}`}
                        className="accent-accent cursor-pointer"
                        ref={checkboxRef}
                    />
                    <label htmlFor={`uicheckbox-${userInputRequest.requestid}`} className="cursor-pointer">
                        {t(userInputRequest.checkboxmsg)}
                    </label>
                </div>
            </div>
        );
    }, [userInputRequest.checkboxmsg, userInputRequest.requestid, t]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (countdown <= 0) {
            timeout = setTimeout(() => {
                handleSendErrResponse();
            }, 300);
        } else {
            timeout = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        }
        return () => clearTimeout(timeout);
    }, [countdown]);

    const handleNegativeResponse = useCallback(() => {
        switch (userInputRequest.responsetype) {
            case "text":
                handleSendErrResponse();
                break;
            case "confirm":
                handleSendConfirm(false);
                break;
        }
    }, [userInputRequest.responsetype, handleSendErrResponse, handleSendConfirm]);

    const okLabel = userInputRequest.oklabel ? t(userInputRequest.oklabel) : undefined;
    const cancelLabel = userInputRequest.cancellabel ? t(userInputRequest.cancellabel) : undefined;

    return (
        <Modal
            className="pt-6 pb-4 px-5"
            onOk={() => handleSubmit()}
            onCancel={() => handleNegativeResponse()}
            onClose={() => handleSendErrResponse()}
            okLabel={okLabel}
            cancelLabel={cancelLabel}
        >
            <div className="font-bold text-primary mx-4 pb-2.5">
                {t("{{title}} ({{seconds}}s)", { title: translatedTitle, seconds: countdown })}
            </div>
            <div className="flex flex-col justify-between gap-4 mx-4 mb-4 max-w-[500px] font-mono text-primary">
                {queryText}
                {inputBox}
                {optionalCheckbox}
            </div>
        </Modal>
    );
};

UserInputModal.displayName = "UserInputModal";

export { UserInputModal };
