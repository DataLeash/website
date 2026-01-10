'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Contact {
    id: string;
    contact_email: string;
    contact_name?: string;
    created_at: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tableError, setTableError] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        setTableError(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Check if table doesn't exist
            if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116') {
                setTableError(true);
            } else {
                console.error('Error fetching contacts:', error);
            }
        } else {
            setContacts(data || []);
        }
        setLoading(false);
    };

    const addContact = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        if (contacts.some(c => c.contact_email.toLowerCase() === newEmail.toLowerCase())) {
            alert('This contact already exists');
            return;
        }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('You must be logged in to add contacts');
            setSaving(false);
            return;
        }

        const { data, error } = await supabase
            .from('contacts')
            .insert({
                user_id: user.id,
                contact_email: newEmail,
                contact_name: newName || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding contact:', error);
            alert('Failed to add contact');
        } else if (data) {
            setContacts([data, ...contacts]);
            setNewEmail('');
            setNewName('');
        }
        setSaving(false);
    };

    const deleteContact = async (id: string) => {
        if (!confirm('Delete this contact?')) return;

        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting contact:', error);
            alert('Failed to delete contact');
        } else {
            setContacts(contacts.filter(c => c.id !== id));
        }
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <p className="text-[var(--foreground-muted)]">Manage your trusted contacts for quick sharing</p>
                </div>

                {/* Add Contact */}
                <div className="glass-card p-6 mb-8 slide-up">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Icon3D type="users" size="sm" />
                        Add New Contact
                    </h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Name (optional)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                        />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addContact()}
                            className="flex-1 px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                        />
                        <button
                            onClick={addContact}
                            disabled={saving}
                            className="glow-button px-6 py-3 rounded-lg font-semibold text-black disabled:opacity-50 min-w-[140px] flex justify-center items-center"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Add Contact'
                            )}
                        </button>
                    </div>
                </div>

                {/* Table Error - Show instructions */}
                {tableError ? (
                    <div className="glass-card p-8 text-center slide-up">
                        <div className="mb-4 flex justify-center">
                            <Icon3D type="danger" size="xl" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--warning)] mb-2">Database Setup Required</h2>
                        <p className="text-[var(--foreground-muted)] mb-4">
                            The contacts table hasn't been created yet.
                        </p>
                        <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg text-left mb-4 max-w-xl mx-auto">
                            <p className="text-sm text-[var(--foreground-muted)] mb-2">Run this SQL in Supabase SQL Editor:</p>
                            <code className="text-xs text-[var(--primary)] block overflow-x-auto whitespace-pre">
                                {`-- Run add_contacts_table.sql
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;`}
                            </code>
                        </div>
                        <button
                            onClick={fetchContacts}
                            className="glow-button px-6 py-3 rounded-lg font-semibold text-black"
                        >
                            Retry
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" text="Loading contacts..." />
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-12 glass-card slide-up">
                        <div className="mb-4 flex justify-center">
                            <Icon3D type="users" size="xl" />
                        </div>
                        <p className="text-xl text-[var(--foreground-muted)]">No contacts yet</p>
                        <p className="text-sm text-[var(--foreground-muted)] mt-2">Add contacts for faster file sharing</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden slide-up" style={{ animationDelay: '0.1s' }}>
                        <table className="w-full">
                            <thead className="bg-[rgba(0,212,255,0.1)]">
                                <tr>
                                    <th className="text-left px-6 py-4">Contact</th>
                                    <th className="text-left px-6 py-4">Email</th>
                                    <th className="text-left px-6 py-4">Added</th>
                                    <th className="text-right px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="border-t border-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.03)] transition">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <Icon3D type="users" size="sm" />
                                            <span className="font-medium text-white">{contact.contact_name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--foreground-muted)]">{contact.contact_email}</td>
                                        <td className="px-6 py-4 text-[var(--foreground-muted)]">
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteContact(contact.id)}
                                                className="px-3 py-1 bg-[rgba(239,68,68,0.1)] text-[var(--error)] rounded hover:bg-[rgba(239,68,68,0.2)] transition text-sm font-medium border border-[rgba(239,68,68,0.3)]"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
