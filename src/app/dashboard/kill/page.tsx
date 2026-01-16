'use client'

import Link from "next/link";
import { useState } from "react";
import { useFiles } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { RequirePro } from "@/components/RequirePro";

export default function KillPage() {
    const router = useRouter();
    const { files, chainKill } = useFiles();
    const [confirmation, setConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChainKill = async () => {
        if (confirmation !== 'DESTROY ALL') return;
        setLoading(true);
        const result = await chainKill();
        setLoading(false);
        if (!result.error) {
            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 3000);
        }
    };

    return (
        <RequirePro feature="Kill Switch">
            <div className="gradient-bg min-h-screen">
                <Sidebar />

                <main className="ml-72 p-8 max-w-2xl">
                    {success ? (
                        <div className="text-center py-12">
                            <div className="mb-4 flex justify-center">
                                <Icon3D type="destroy" size="xl" />
                            </div>
                            <h1 className="text-3xl font-bold text-[var(--error)] mb-4">All Files Destroyed</h1>
                            <p className="text-[var(--foreground-muted)]">Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="mb-4 flex justify-center">
                                    <Icon3D type="destroy" size="xl" />
                                </div>
                                <h1 className="text-3xl font-bold text-[var(--error)]">Chain Kill</h1>
                                <p className="text-[var(--foreground-muted)] mt-2">Permanently destroy ALL your protected files</p>
                            </div>

                            <div className="glass-card p-6 border-[var(--error)]">
                                <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--error)] rounded-lg p-4 mb-6">
                                    <p className="text-[var(--error)] font-medium flex items-center gap-2">
                                        <Icon3D type="danger" size="sm" />
                                        This action cannot be undone!
                                    </p>
                                    <p className="text-sm text-[var(--foreground-muted)] mt-2">All {files.length} files will be permanently destroyed. All shared links will stop working immediately. All encryption keys will be deleted.</p>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">Type "DESTROY ALL" to confirm</label>
                                    <input
                                        type="text"
                                        value={confirmation}
                                        onChange={(e) => setConfirmation(e.target.value)}
                                        placeholder="DESTROY ALL"
                                        className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--error)] focus:outline-none text-center text-xl tracking-widest"
                                    />
                                </div>

                                <button
                                    onClick={handleChainKill}
                                    disabled={confirmation !== 'DESTROY ALL' || loading}
                                    className="w-full py-4 rounded-lg font-bold text-white bg-[var(--error)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Destroying...
                                        </>
                                    ) : (
                                        <>
                                            <Icon3D type="danger" size="sm" />
                                            Destroy All Files
                                        </>
                                    )}
                                </button>

                                <Link href="/dashboard" className="block text-center mt-4 text-[var(--foreground-muted)] hover:text-white">
                                    Cancel and go back
                                </Link>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </RequirePro>
    );
}
