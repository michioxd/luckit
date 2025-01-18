import { useCallback, useState } from "react";
import LuckitLogo from "../components/Logo";
import cls from "./Login.module.scss";
import clsx from "clsx";
import { validateEmail } from "../utils/string";
import Spinner from "../components/Spinner";
import { API, GenericError, ResponseError } from "../services/api";
import { useMainContext } from "../MainContext";
import { VscClose } from "react-icons/vsc";
import { UserType } from "../types/user";
import PhoneNumberInput from "../components/PhoneNumber";
export default function LoginScreen() {
    const mainCtx = useMainContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showWarn, setShowWarn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [otpLogin, setOtpLogin] = useState(false);
    const [pNInput, setPNInput] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneNumberValid, setPhoneNumberValid] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [sentOtp, setSentOtp] = useState(false);

    const handleSendOtp = useCallback(async () => {
        setError("");
        setLoading(true);

        try {
            const res = await API.requestOTP(phoneNumber);

            if (res) {
                setSentOtp(true);
                setLoading(false);
                return;
            }
            setError("Unable to send OTP!");
            setLoading(false);
        } catch (e: any) {
            const error = e as ResponseError<GenericError>;
            setLoading(false);
            setError(
                error.error.message === 'INVALID_PHONE_NUMBER' ? "Invalid phone number" :
                    "Unable to send OTP: (" + error.error.message + ")");
        }
    }, [phoneNumber]);

    const handleLogin = useCallback(async () => {
        setError("");
        setShowWarn(false);
        setLoading(true);

        if (otpLogin) {
            try {
                const res = await API.verifyOTP(phoneNumber, otpCode);

                if (res.token) {
                    const exchange = await API.exchangeOTPTokenForIDToken(res.token);

                    const user = await API.getAccountInfo(exchange.idToken);

                    if (!user.users[0]) {
                        setError("Something went wrong, please try again");
                        setLoading(false);
                        return;
                    }

                    chrome.storage.local.set({
                        token: exchange.idToken,
                        refreshToken: exchange.refreshToken,
                        user: user.users[0] as UserType
                    }, () => {
                        chrome.runtime.sendMessage({ fetchLatestMoment: true, login: true });
                        mainCtx.setLoggedIn(true);
                    });
                    return;
                }

                setError("Unable to login!");
                setLoading(false);
            } catch (e: any) {
                const error = e as ResponseError<GenericError>;
                setLoading(false);
                setError(
                    error.error.message === 'INVALID_CODE' ? "Invalid OTP code" :
                        "We encountered an error: (" + error.error.message + ")");
            }
            return;
        }

        try {
            const res = await API.login(email, password);

            if (res) {
                const user = await API.getAccountInfo(res.idToken);

                if (!user.users[0]) {
                    setError("Something went wrong, please try again");
                    setLoading(false);
                    return;
                }

                chrome.storage.local.set({
                    token: res.idToken,
                    refreshToken: res.refreshToken,
                    user: user.users[0] as UserType
                }, () => {
                    chrome.runtime.sendMessage({ fetchLatestMoment: true, login: true });
                    mainCtx.setLoggedIn(true);
                });
                return;
            }
            setError("Unable to login!");
            setLoading(false);
        } catch (e: any) {
            const error = e as ResponseError<GenericError>;
            setLoading(false);
            setError(
                error.error.message === 'INVALID_PASSWORD' ?
                    'Invalid password' : error.error.message === "EMAIL_NOT_FOUND" ? "We couldn't find your email, check again" :
                        error.error.message === "INVALID_EMAIL" ? "Invalid email" :
                            error.error.message === "USER_DISABLED" ? "User is disabled" :
                                "We encountered an error: (" + error.error.message + ")");
        }
    }, [otpLogin, phoneNumber, otpCode, mainCtx, email, password]);

    return (
        <div className={clsx(cls.Section, showWarn && cls.s1)}>
            <div className={clsx("Error", !!error && "showErr")}>
                <span>{error}</span>
                <div className={"Close"} onClick={() => setError("")}>
                    <VscClose />
                </div>
            </div>
            <div className={clsx(cls.LoginWarn)}>
                <div className={cls.Content}>
                    <h1>Before you proceed...</h1>
                    <p>This project is not affiliated with Locket or Locket Labs, Inc in any way. By using this extension, you acknowledge that it is an unofficial Locket client, and you accept the risk that your account may be banned.
                        <br />
                        If you are unsure about this or you don't know what you are doing, please refrain from using this extension.
                        <br />
                        I (luckit's creator) will not be held responsible for any consequences.</p>
                    <button
                        onClick={handleLogin}
                        className={clsx("btn")}>
                        Continue
                    </button>
                    <button
                        className={clsx("btn btn-soft")}
                        onClick={() => setShowWarn(false)}
                    >
                        Back
                    </button>
                </div>
            </div>
            <div className={cls.Login}>
                <div className={cls.Intro}>
                    <div className={cls.Logo}>
                        <LuckitLogo />
                    </div>
                    <div className={cls.Title}>
                        <h1>welcome to luckit</h1>
                        <p>
                            please login to your Locket account.
                        </p>
                    </div>
                </div>
                <div className={cls.Form} data-otp-step={otpLogin ? sentOtp ? '2' : '1' : '0'}>
                    {otpLogin ? <>
                        <PhoneNumberInput
                            value={pNInput}
                            onValueChange={(v) => setPNInput(v)}
                            onE164ValueChange={(v) => setPhoneNumber(v)}
                            onSuccessChange={(v) => setPhoneNumberValid(v)}
                            className={clsx("input", cls.Input)}
                        />
                        {sentOtp &&
                            <input
                                style={{ marginTop: '0.5rem' }}
                                className={clsx("input", cls.Input)}
                                disabled={loading}
                                type="text"
                                name="otp"
                                placeholder="otp"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                            />
                        }
                    </> : <>
                        <input
                            className={clsx("input", cls.Input)}
                            disabled={loading}
                            type="text"
                            name="email"
                            placeholder="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            className={clsx("input", cls.Input)}
                            disabled={loading}
                            type="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </>
                    }
                    {(otpLogin && !sentOtp) ? <button
                        disabled={loading || !phoneNumber || !phoneNumberValid}
                        className={clsx(cls.Button, "btn")}
                        onClick={() => handleSendOtp()}
                    >
                        {loading ?
                            <div className={cls.Loading}>
                                <Spinner data-size="3" />
                            </div>
                            : !phoneNumberValid ? "invalid phone number" : "send otp"}
                    </button> :
                        <button
                            disabled={
                                otpLogin ? !otpCode || otpCode.length < 6 || otpCode.length > 6 || !phoneNumber || !phoneNumberValid || loading :
                                    !email || !password || !validateEmail(email) || loading
                            }
                            className={clsx(cls.Button, "btn")}
                            onClick={() => setShowWarn(true)}
                        >
                            {loading ?
                                <div className={cls.Loading}>
                                    <Spinner data-size="3" />
                                </div>
                                : "login"}
                        </button>
                    }
                    <a className={cls.anotherMethod} onClick={() => { setOtpLogin(!otpLogin); setPhoneNumber(""); setPNInput(""); setOtpCode(""); }}>
                        {otpLogin ? "login with email and password" : "login with phone number"}
                    </a>
                </div>

                <p className={cls.forkMe}>
                    made with luv by <a target="_blank" href="https://github.com/michioxd">michioxd</a> - <a target="_blank" href="https://github.com/michioxd/luckit">fork me on github</a>
                </p>
            </div>
        </div>
    )
}
