import clsx from 'clsx';
import clsMain from './Main.module.scss';
import cls from './Uploader.module.scss';
import { MdOutlineImage } from 'react-icons/md';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscClose } from 'react-icons/vsc';
import Spinner from '../components/Spinner';
import { UserType } from '../types/user';
import { API } from '../services/api';

export default function UploaderScreen() {
    const [file, setFile] = useState<null | File>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [fileBuffer, setFileBuffer] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(false);
    const [editCaption, setEditCaption] = useState(false);
    const [caption, setCaption] = useState("");

    const handleCancel = () => {
        setFile(null);
        setFileBuffer(null);
        setEditCaption(false);
        setCaption("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    const handleUploadImage = useCallback(async () => {
        if (!fileBuffer) return;
        setLoading(true);

        let userId = "", token = "", refreshToken = "";
        const imageName = Date.now() + "_vtd182.webp";

        if (await new Promise((ok) => {
            chrome.storage.local.get(['user', 'token', 'refreshToken'], (result) => {
                if (result.user) {
                    userId = (result.user as UserType).localId;
                    token = result.token;
                    refreshToken = result.refreshToken;
                    ok(true);
                    return;
                }
                ok(false);
            });
        }) === false) {
            setError("Error getting user info");
            setLoading(false);
            return;
        }

        try {
            const newToken = (await API.refreshToken(refreshToken));
            if (!newToken) {
                setError("Error refreshing token");
                setLoading(false);
                return;
            }

            token = newToken.id_token;
            refreshToken = newToken.refresh_token;

            const gatherinbgUploadEnpoint = await fetch(`https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}?uploadType=resumable&name=users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json; charset=UTF-8",
                    Accept: "application/json",
                    "X-Goog-Upload-Protocol": "resumable",
                    "X-Goog-Upload-Content-Length": fileBuffer.size.toString(),
                    "X-Firebase-Storage-Version": "ios/10.28.1",
                    "User-Agent": "com.locket.Locket/1.43.1 iPhone/18.1 hw/iPhone15_3 (GTMSUF/1)",
                    "X-Goog-Upload-Content-Type": "image/webp",
                    "X-Goog-Upload-Command": "start",
                    "X-Firebase-Gmpid": "1:641029076083:ios:cc8eb46290d69b234fa609",
                },
                method: "POST",
                body: JSON.stringify({
                    name: `users/${userId}/moments/thumbnails/${imageName}`,
                    contentType: "image/webp",
                    bucket: "",
                    metadata: {
                        creator: userId,
                        visibility: "private"
                    }
                })
            });

            if (!gatherinbgUploadEnpoint.ok) {
                setError("Failed to upload (server error)");
                setLoading(false);
                return;
            }

            const uploadEnpoint = gatherinbgUploadEnpoint.headers.get("X-Goog-Upload-URL");

            if (!uploadEnpoint) {
                setError("Failed to upload (invalid enpoint)");
                setLoading(false);
                return;
            }

            const uploadImage = await fetch(uploadEnpoint, {
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-Goog-Upload-Command": "upload, finalize",
                    "X-Goog-Upload-Offset": "0",
                    "Upload-Incomplete": "?0",
                    "Upload-Draft-Interop-Version": "3",
                    "User-Agent": "com.locket.Locket/1.43.1 iPhone/18.1 hw/iPhone15_3 (GTMSUF/1)",
                },
                method: "PUT",
                body: fileBuffer
            });

            if (!uploadImage.ok) {
                setError("Failed to upload (server error)");
                setLoading(false);
                return;
            }

            const endUrl = `https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}`;
            const getUrl = await fetch(endUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json; charset=UTF-8",
                    Accept: "application/json",
                    "User-Agent": "com.locket.Locket/1.43.1 iPhone/18.1 hw/iPhone15_3 (GTMSUF/1)",
                }
            });

            if (!getUrl.ok) {
                setError("Failed to fetch image URL");
                setLoading(false);
                return;
            }

            const imgToken = (await getUrl.json()).downloadTokens;

            if (!imgToken) {
                setError("Failed to fetch image URL");
                setLoading(false);
                return;
            }

            const finalImageUrl = endUrl + "?alt=media&token=" + imgToken;

            const createPost = await API.createPost(finalImageUrl, caption);

            if (!createPost) {
                setError("Failed to post");
                setLoading(false);
                return;
            }

            setError("Done!");
            setLoading(false);
            handleCancel();
        } catch (e: any) {
            console.error(e);
            setError("Failed to upload, check details");
            setLoading(false);
        }
    }, [caption, fileBuffer]);

    const previewUrl = useMemo(() => {
        if (fileBuffer) {
            return URL.createObjectURL(fileBuffer);
        }

        return "";
    }, [fileBuffer]);

    useEffect(() => {
        if (!file) return;

        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => img.src = reader.result as string;
        reader.readAsDataURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Error converting image to WebP [CANVAS_NULLED]');
                setLoading(false);
                handleCancel();
                return;
            }

            ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        setFileBuffer(blob);
                    } else {
                        setError('Error converting image to WebP');
                        handleCancel();
                    }
                    setLoading(false);
                },
                'image/webp',
                1
            );
        };
    }, [file]);

    return (
        <>
            <div className={clsx(clsMain.MainScreen, cls.Uploader)}>
                <div className={clsx("Error", !!error && "showErr")}>
                    <span>{error}</span>
                    <div className={"Close"} onClick={() => setError("")}>
                        <VscClose />
                    </div>
                </div>
                <div className={clsMain.Moment}>
                    <div className={clsMain.LsMoment}>
                        <div className={clsMain.Main}>
                            <div className={clsMain.Image} style={{ "--moment-img": `url(${previewUrl})` } as React.CSSProperties}>
                                <input
                                    ref={inputRef}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            if (e.target.files[0].size > 10 * 1024 * 1024) {
                                                setError("Image size exceeded limit");
                                                handleCancel();
                                                return;
                                            }
                                            if (e.target.files[0].type !== "image/jpeg" && e.target.files[0].type !== "image/png") {
                                                setError("Unsupported file");
                                                handleCancel();
                                                return;
                                            }
                                            setLoading(true);
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    className={cls.UploadInput} type="file" accept=".jpeg,.jpg,.png" />
                                {previewUrl.length > 0 ? <div
                                    onClick={() => !loading && setEditCaption(true)}
                                    className={clsMain.Caption}>
                                    {editCaption ? <input
                                        onBlur={() => {
                                            setEditCaption(false);
                                        }}
                                        className={cls.editCaption}
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                    /> : caption.length > 0 ? caption : "click to add caption"}
                                </div> : <div className={cls.UploaderOverlay}>
                                    <div className={cls.Icon}>
                                        <MdOutlineImage />
                                    </div>
                                    <h2>drag and drop or click to choose image</h2>
                                    <p>supports jpeg/png below 10MB</p>
                                </div>}
                            </div>
                            <div className={clsMain.UserInfo}>
                                <button disabled={loading || !file} onClick={() => handleUploadImage()} className={clsx("btn", "btn-soft", cls.UploadBtn)}>
                                    {loading ? <Spinner /> : "upload"}
                                </button>
                                <button disabled={loading || !file} className={cls.CloseBtn} onClick={handleCancel}>
                                    <VscClose />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
