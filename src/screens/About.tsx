import LuckitLogo from "../components/Logo";
import WhatIcon from "../components/WhatIcon";
import { VERSION } from "../const";
import cls from "./About.module.scss";

export default function AboutScreen() {
    return (
        <div className={cls.About}>
            <div className={cls.Intro}>
                <div className={cls.Logo}>
                    <LuckitLogo />
                </div>
                <div className={cls.Title}>
                    <h1>luckit</h1>
                    <p>
                        an unofficial Locket extension to show live photos from your friends.
                    </p>
                    <p className={cls.Version}>
                        version: {VERSION}
                    </p>
                </div>
            </div>
            <div className={cls.Disclaimer}>
                <h2>Disclaimer</h2>
                <p>
                    This project is not affiliated with Locket or Locket Labs, Inc in any way. By using this extension, you acknowledge that it is an unofficial Locket client, and you accept the risk that your account may be banned.
                    <br />
                    If you're unsure about this or you don't know what you are doing, please refrain from using this extension.
                    <br />
                    I (luckit's creator) won't be held responsible for any consequences.
                </p>
            </div>
            <div className={cls.Bruh}>
                <div className={cls.Logo}>
                    <WhatIcon />
                </div>
                <p>
                    &copy; {new Date().getFullYear()} <a target="_blank" href="https://github.com/michioxd">michioxd</a> powered.
                </p>
                <p>
                    Released under <a target="_blank" href="https://github.com/michioxd/luckit/blob/main/LICENSE">MIT License</a>. Source code available on <a target="_blank" href="https://github.com/michioxd/luckit">GitHub</a>.
                </p>
            </div>
        </div>
    )
}
