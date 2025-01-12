import { useCallback, useState } from "react";
import LuckitLogo from "../components/Logo";
import cls from "./Login.module.scss";
import clsx from "clsx";
import { validateEmail } from "../utils/string";
import Spinner from "../components/Spinner";
export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showWarn, setShowWarn] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = useCallback(() => {
        setShowWarn(false);
        setLoading(true);
    }, []);

    return (
        <div className={clsx(cls.Section, showWarn && cls.s1)}>
            <div className={clsx(cls.LoginWarn)}>
                <div className={cls.Content}>
                    <h1>Before you login...</h1>
                    <p>By using this extension, you acknowledge that it is an unofficial Locket client, and you accept the risk that your account may be banned.
                        <br />
                        If you are not comfortable with this or you don't know what you are doing, please do not use this extension and remove it from your browser.
                        <br />
                        I (creator of this extension) will not be held responsible for any consequences.</p>
                    <button
                        onClick={handleLogin}
                        className={clsx("btn")}>
                        I known what I'm doing
                    </button>
                    <button
                        className={clsx("btn btn-soft")}
                        onClick={() => setShowWarn(false)}
                    >
                        Cancel
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
                            login to your Locket account to continue.
                        </p>
                    </div>
                </div>
                <div className={cls.Form}>
                    <input
                        className={cls.Input}
                        disabled={loading}
                        type="text"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className={cls.Input}
                        disabled={loading}
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        disabled={!email || !password || !validateEmail(email) || loading}
                        className={clsx(cls.Button, "btn")}
                        onClick={() => setShowWarn(true)}
                    >
                        {loading ?
                            <div className={cls.Loading}>
                                <Spinner data-size="3" />
                            </div>
                            : "login"}
                    </button>
                </div>
                <p className={cls.forkMe}>
                    made with luv by <a target="_blank" href="https://github.com/michioxd">michioxd</a> - <a target="_blank" href="https://github.com/michioxd/luckit">fork me on github</a>
                </p>
            </div>
        </div>
    )
}