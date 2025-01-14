import MainScreen from "./Main";
import cls from "./Global.module.scss";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";
import { Menu, MenuButton, MenuItem, SubMenu } from "@szhsin/react-menu";
import clsx from "clsx";
import { useMainContext } from "../MainContext";
import { IoMdHeartEmpty } from "react-icons/io";
import { HiLogout, HiOutlineDownload, HiOutlineUpload } from "react-icons/hi";
import { GrAppsRounded } from "react-icons/gr";
import { AiOutlineClear } from "react-icons/ai";
import { VERSION } from "../const";
import { MdRefresh } from "react-icons/md";
import { useState } from "react";
import { SavedMomentType } from "../types/moments";
import SavedMoment from "./SavedMoments";
import { IoChevronBack } from "react-icons/io5";
import AboutScreen from "./About";
import UploaderScreen from "./Uploader";

const menuItemClassName = ({ hover }: { hover: boolean }) =>
    clsx(cls.MenuItem, hover && cls.hover);

const RefreshMenuItem = () => {
    const [disabledRefresh, setDisabledRefresh] = useState(false);

    return (
        <MenuItem disabled={disabledRefresh} onClick={() => {
            if (disabledRefresh) return;
            setDisabledRefresh(true);
            chrome.runtime.sendMessage({ fetchLatestMoment: true }, () => {
                setTimeout(() => {
                    setDisabledRefresh(false);
                }, 5e3);
            });
        }} className={menuItemClassName}>
            <MdRefresh />
            {disabledRefresh ? "Refreshing..." : "Refresh"}
        </MenuItem>
    )
}

export default function GlobalScreen() {
    const mainCtx = useMainContext();
    const [inItem, setInItem] = useState(0);
    const [section, setSection] = useState(0);

    return (
        <div className={cls.Global} data-section={section}>
            <div onClick={() => setSection(0)} className={clsx(cls.MenuBtn, cls.BackBtn)}>
                <IoChevronBack />
            </div>
            <Menu menuClassName={cls.Menu} menuButton={<MenuButton className={clsx(cls.MenuBtn, cls.MainMenuBtn)}>
                <PiDotsThreeOutlineVerticalLight />
            </MenuButton>} transition>
                <SubMenu label={
                    <>
                        <img className={cls.Avatar} src={mainCtx?.userData?.photoUrl} alt={mainCtx?.userData?.displayName} />
                        <span className={cls.Name}>{mainCtx?.userData?.displayName ? mainCtx?.userData?.displayName : mainCtx?.userData?.email}</span>
                    </>
                } menuClassName={cls.Menu} className={cls.AccountMenu}>
                    <MenuItem onClick={() => {
                        chrome.runtime.sendMessage({ clearAllMoments: true });
                    }} className={menuItemClassName}>
                        <AiOutlineClear />
                        Clear gallery
                    </MenuItem>
                    <MenuItem onClick={() => {
                        chrome.runtime.sendMessage({ actionLogout: true });
                        mainCtx.setLoggedIn(false);
                    }} className={menuItemClassName}>
                        <HiLogout />
                        Log out
                    </MenuItem>
                </SubMenu>
                <MenuItem onClick={() => setSection(2)} className={menuItemClassName}>
                    <IoMdHeartEmpty />
                    about luckit v{VERSION}
                </MenuItem>
                <RefreshMenuItem />
                <MenuItem onClick={() => setSection(1)} className={menuItemClassName}>
                    <GrAppsRounded />
                    Gallery
                </MenuItem>
                <MenuItem onClick={() => setSection(3)} className={menuItemClassName}>
                    <HiOutlineUpload />
                    Upload image
                </MenuItem>
                <MenuItem onClick={() => {
                    chrome.storage.local.get(['moments'], (result) => {
                        if (result.moments) {
                            const moments = result.moments as SavedMomentType[];
                            const moment = moments[inItem];
                            if (!moment) return;
                            chrome.downloads.download({
                                url: moment.thumbnail_url,
                                filename: Date.now() + ".webp",
                                saveAs: true
                            });
                        }
                    });
                }} className={menuItemClassName}>
                    <HiOutlineDownload />
                    Download this image
                </MenuItem>
            </Menu>
            <div className={cls.Section} data-section="0">
                <MainScreen
                    inItem={inItem}
                    setInItem={setInItem}
                />
            </div>
            <div className={cls.Section} data-section="1">
                <SavedMoment setInItem={(i: number) => {
                    setInItem(i);
                    setSection(0);
                }} />
            </div>
            <div className={cls.Section} data-section="2">
                <AboutScreen />
            </div>
            <div className={cls.Section} data-section="3">
                <UploaderScreen />
            </div>
        </div>
    )
}
