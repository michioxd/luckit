import { MomentType, SavedMomentType } from "../types/moments";
import { UserType } from "../types/user";
import { API } from "./api";
import { md5 } from 'js-md5';

async function RefreshToken(rT: string): Promise<{
    token: string;
    refreshToken: string;
} | void> {
    try {
        const newToken = await API.refreshToken(rT);

        if (!newToken.access_token) {
            chrome.storage.local.remove(['token', 'refreshToken', 'user'], () => {
                chrome.runtime.sendMessage({ logout: true });
                console.log("token expired, please login again");
            });
            return;
        }

        chrome.storage.local.set({
            token: newToken.access_token,
            refreshToken: newToken.refresh_token
        });

        return {
            token: newToken.access_token,
            refreshToken: newToken.refresh_token
        }
    } catch (e: any) {
        console.error("Cannot refresh token", e);
        return;
    }
}

async function FetchLatestMoment() {
    let token = "", refreshToken = "";

    if (await new Promise((ok) => {
        chrome.storage.local.get(['token', 'refreshToken'], (result) => {
            if (result.token && result.refreshToken) {
                token = result.token;
                refreshToken = result.refreshToken;
                ok(true);
                return;
            }

            ok(false);
        })
    }) === false) {
        return;
    }

    let isOkay = false;

    try {
        const accInfo = await API.getAccountInfo(token);

        chrome.storage.local.set({
            user: accInfo.users[0] as UserType || {}
        });

        isOkay = true;
    } catch {
        const tryRefresh = await RefreshToken(refreshToken);

        if (tryRefresh?.token && tryRefresh?.refreshToken) {
            token = tryRefresh.token;
            refreshToken = tryRefresh.refreshToken;
            isOkay = true;
        }
    }

    if (!isOkay) {
        console.log("Cannot get user info");
        return;
    }

    let moment: MomentType | null = null;

    try {
        moment = await API.fetchLatestMoment(token);
        isOkay = true;
    } catch {
        isOkay = false;
        const tryRefresh = await RefreshToken(refreshToken);

        if (tryRefresh?.token && tryRefresh?.refreshToken) {
            token = tryRefresh.token;
            refreshToken = tryRefresh.refreshToken;
            isOkay = true;
        }

        moment = await API.fetchLatestMoment(token);
        isOkay = true;
    }

    if (!isOkay) {
        console.log("Cannot get latest moment due to token expired");
        return;
    }

    if (moment && !moment.data[0]) {
        console.log("Cannot get latest moment");
        return;
    }

    const lastMD5 = await new Promise<string>((res) => {
        chrome.storage.local.get(['lastMD5'], (result) => {
            res(result.lastMD5 ?? "");
        });
    });

    const currentMD5 = md5(JSON.stringify(moment.data[0]));
    const thisMoment = moment.data[0];

    if (lastMD5 === currentMD5) {
        return;
    }

    if (await new Promise((res) => {
        chrome.storage.local.get(['moments'], (result) => {
            if (result.moments) {
                if (result.moments.some((m: SavedMomentType) => (m.md5 ?? md5(JSON.stringify(m))) === currentMD5)) {
                    console.log("moment already saved");
                    res(false);
                    return;
                }
                res(true);
            }
            res(true);
        });
    }) === false) {
        return;
    }

    const thisUser = await API.fetchUser(thisMoment.user, token);

    if (!thisUser?.data?.uid) {
        console.log("cannot get user info");
        return;
    }

    chrome.storage.local.get(['unReadMoments', 'moments'], (result) => {
        chrome.storage.local.set({
            lastMD5: currentMD5,
            unReadMoments: result.unReadMoments + 1 || 1,
            moments: [
                {
                    user: {
                        username: thisUser.data.first_name + " " + thisUser.data.last_name,
                        avatar: thisUser.data.profile_picture_url,
                        uid: thisUser.data.uid
                    },
                    md5: currentMD5,
                    thumbnail_url: thisMoment.thumbnail_url,
                    seconds: thisMoment.date._seconds * 1000,
                    caption: thisMoment.caption
                } as SavedMomentType,
                ...result.moments ?? [],
            ] as SavedMomentType[],
        }, () => {
            console.log("new moment saved");
            chrome.runtime.sendMessage({ newMoment: true });
            chrome.action.setBadgeBackgroundColor({ color: '#C773AF' }, () => {
                chrome.action.setBadgeText({ text: (result.unReadMoments + 1).toString() });
            });
        });
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.fetchLatestMoment) {
        FetchLatestMoment();
        return;
    }

    if (message.clearBadge) {
        chrome.storage.local.set({ unReadMoments: 0 }, () => {
            chrome.action.setBadgeText({ text: '' });
        });
        return;
    }

    if (message.actionLogout) {
        chrome.storage.local.remove(['token', 'refreshToken', 'user'], () => {
            chrome.runtime.sendMessage({ logout: true });
        });
    }

    if (message.clearAllMoments) {
        chrome.storage.local.remove(['moments', 'unReadMoments', 'lastMD5'], () => {
            chrome.action.setBadgeText({ text: '' });
            chrome.runtime.sendMessage({ newMoment: true });
        });
    }
});

const loop = async () => {
    try { await FetchLatestMoment(); } catch { /* empty */ }
    setTimeout(loop, 25e3);
};

(async () => loop())();

chrome.storage.local.get(['unReadMoments'], (result) => {
    chrome.action.setBadgeBackgroundColor({ color: '#C773AF' }, () => {
        chrome.action.setBadgeText({ text: (result.unReadMoments || 0).toString() });
    });
});