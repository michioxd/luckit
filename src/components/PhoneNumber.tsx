import { CountryCode } from "libphonenumber-js";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Menu, MenuButton, MenuItem } from "@szhsin/react-menu";
import clsx from "clsx";

export default function PhoneNumberInput(props: {
    defaultCountry?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onE164ValueChange?: (value: string) => void;
    onSuccessChange?: (success: boolean) => void;
    className?: string;
}) {
    const [libPhoneNumber, setLibPhoneNumber] = useState<typeof import("../modules/phone/phone") | null>(null);
    const [flagsHandler, setFlagsHandler] = useState<typeof import("../modules/phone/flags") | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        import("../modules/phone/phone").then(setLibPhoneNumber);
        import("../modules/phone/flags").then(setFlagsHandler);
    }, []);

    const oldCursorPos = useRef<number>(0);
    const setCursorPos = useRef<number>(NaN);

    const [internalValue, setInternalValue] = useState<string>(props.defaultValue || "");
    const [country, setCountry] = useState(props.defaultCountry || "ZZ");

    useEffect(() => {
        if (props.defaultCountry) {
            setCountry(props.defaultCountry);
        }
    }, [props.defaultCountry]);

    const formatter = useMemo(() => {
        if (libPhoneNumber) {
            const ayt = new libPhoneNumber.AsYouType(country as CountryCode);
            setInternalValue(ayt.input(internalValue));
            if (ayt.isValid()) {
                const international = (["800", "808", "870", "870", "878", "881", "882", "883", "888", "979"] as string[]).includes(ayt.getCallingCode() ?? "");
                if (ayt.getCountry() || international) {
                    setCountry(ayt.getCountry() || "ZZ");
                }
            }
            return ayt;
        } else return null;
    }, [country, internalValue, libPhoneNumber]);

    useEffect(() => {
        if (typeof props.value === "string")
            setInternalValue(props.value);
    }, [props.value]);

    useEffect(() => {
        if (libPhoneNumber) {
            props.onValueChange?.(internalValue);
            props.onE164ValueChange?.(formatter!.getNumberValue() ?? "");
            props.onSuccessChange?.(formatter!.isValid() === true);
        }
    }, [formatter, internalValue, libPhoneNumber, props]);

    useEffect(() => {
        if (inputRef.current && !isNaN(setCursorPos.current)) {
            inputRef.current.selectionStart = setCursorPos.current;
            inputRef.current.selectionEnd = setCursorPos.current;

            setCursorPos.current = NaN;
        }
    }, [internalValue]);

    const selectFlagList = useMemo(() => {
        if (!libPhoneNumber) return [];

        return libPhoneNumber?.getCountries().map(country => {
            const FlagEl = flagsHandler?.hasFlag(country) ? flagsHandler!.Flags[country as any as keyof typeof flagsHandler.Flags] : null;

            return [(
                <MenuItem key={country} value={country} onClick={() => {
                    setCountry(country);
                    if (formatter) {
                        formatter.reset();
                        setInternalValue(formatter.input(internalValue));
                    }
                }}>
                    <div style={{ display: "flex" }}>
                        <div style={{ height: 23, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            {FlagEl ? <FlagEl height={18} /> : country}
                        </div>
                        <div className="HideText" style={{ marginLeft: 8 }}>{country}</div>
                    </div>
                </MenuItem>
            ), country] as const;
        }).sort((a, b) => a[1].localeCompare(b[1])).map(x => x[0]);
    }, [flagsHandler, formatter, internalValue, libPhoneNumber]);

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: '0.5rem', width: '100%', maxWidth: '350px' }}>
                <Menu menuStyle={{
                    overflowY: "auto",
                    maxHeight: "280px",
                }}
                    menuButton={<MenuButton className={clsx("input")} style={{ display: "flex", alignItems: "center", borderRadius: '10px', height: '100%', cursor: 'pointer' }}
                    >
                        {flagsHandler?.hasFlag(country) ? createElement(flagsHandler.Flags[country as any as keyof typeof flagsHandler.Flags], { height: 18 }) : <div style={{ height: '18px', width: '27px' }}></div>}
                    </MenuButton>}
                    transition
                >
                    {selectFlagList}
                </Menu>
                <input
                    value={internalValue}
                    className={clsx("input", props.className)}
                    style={{ flex: 1 }}
                    placeholder="phone number"
                    onKeyDown={e => {
                        oldCursorPos.current = e.currentTarget.selectionEnd ?? e.currentTarget.selectionStart ?? 0;
                    }}
                    onChange={e => {
                        if (!formatter) return; // do not allow any input if libPhoneNumber is not loaded

                        const oldValue = internalValue;
                        let newValue = e.target.value;

                        const oldValueNumber = oldValue.match(/\d|\+/g)?.join("") ?? "";
                        const newValueNumber = newValue.match(/\d|\+/g)?.join("") ?? "";

                        formatter.reset();
                        newValue = formatter.input(newValue);
                        if ((formatter.getCountry() !== country)) {
                            const international = (["800", "808", "870", "870", "878", "881", "882", "883", "888", "979"] as string[]).includes(formatter.getCallingCode() ?? "");
                            if (formatter.getCountry() || international) {
                                setCountry(formatter.getCountry() || "ZZ");
                            }
                        }
                        setInternalValue(newValue);

                        // retain cursor position to correct number position
                        const cursorPos = oldCursorPos.current;
                        const cursorNumberPos = oldValue.slice(0, cursorPos).match(/\d|\+/g)?.length ?? 0;
                        let newCursorNumberPos = cursorNumberPos;

                        // set new cursor position
                        newCursorNumberPos += newValueNumber.length - oldValueNumber.length;

                        let tmpCursorNumberPos = newCursorNumberPos;
                        let newCursorPos = 0;
                        for (const char of newValue) {
                            if (tmpCursorNumberPos === 0) {
                                break;
                            }

                            newCursorPos++;

                            if (char.match(/\d|\+/)) {
                                tmpCursorNumberPos--;
                            }
                        }

                        setCursorPos.current = newCursorPos;
                    }}
                    ref={inputRef}
                />
            </div>
        </>
    )
}