"use client";

import { useRef, useState } from "react";
import { Heart, MessageCircle, Share2, ImagePlus, Send, X, Bookmark, Hash, Pencil, Trash2 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { sports, type Sport } from "@/lib/mock-data";
import { readAndCompressImage, validateImageFile } from "@/lib/image-compress";

function CommentThread({ postId }: { postId: string }) {
  const { data, refresh } = useApiGet<{ comments: any[] }>(`/api/posts/${postId}/comments`);
  const comments = data?.comments ?? [];
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/posts/${postId}/comments`, { content: text.trim() });
      setText("");
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 space-y-2.5 border-t border-court-line pt-3">
      {comments.map((c: any) => (
        <div key={c.id} className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-court text-[11px] font-bold text-ink-muted">
            {(c.author ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </span>
          <div className="rounded-xl bg-court px-3 py-2 text-xs">
            <span className="font-semibold">{c.author}</span> <span className="text-ink-muted">{c.content}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a comment…"
          className="focus-ring flex-1 rounded-full border border-court-line bg-court px-3.5 py-1.5 text-xs placeholder:text-ink-faint"
        />
        <button onClick={send} disabled={sending} className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-volt/10 text-volt hover:bg-volt/20 disabled:opacity-40">
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, onChange, onTagClick, onFollowTag }: { post: any; onChange: () => void; onTagClick: (t: string) => void; onFollowTag: (tag: string, follow: boolean) => void }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(post.bookmarkedByMe);
  const [showComments, setShowComments] = useState(false);
  const isAuthor = user?.id === post.authorId;

  // Task 13, Phase 3: author-only edit/delete.
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleLike() {
    setLiked(!liked);
    setLikeCount((c: number) => c + (liked ? -1 : 1));
    try {
      const res = await apiPost<{ liked: boolean; likes: number }>(`/api/posts/${post.id}/like`, {});
      setLiked(res.liked);
      setLikeCount(res.likes);
    } catch (e) {
      setLiked(liked);
      setLikeCount(post.likes);
      alert((e as Error).message);
    }
  }

  async function toggleBookmark() {
    setBookmarked(!bookmarked);
    try {
      const res = await apiPost<{ bookmarked: boolean }>(`/api/posts/${post.id}/bookmark`, {});
      setBookmarked(res.bookmarked);
    } catch (e) {
      setBookmarked(bookmarked);
      alert((e as Error).message);
    }
  }

  async function saveEdit() {
    if (!editText.trim() && !post.image) return alert("A post needs text or a photo.");
    setSaving(true);
    try {
      await apiPatch(`/api/posts/${post.id}`, { content: editText.trim() });
      setEditing(false);
      onChange();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/posts/${post.id}`);
      onChange();
    } catch (e) {
      alert((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-volt/15 text-sm font-bold text-volt overflow-hidden">
          {post.authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.authorAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (post.author ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-sm font-semibold text-ink">{post.author}</p>
              <span className="text-xs text-ink-faint">· {new Date(post.createdAt).toLocaleDateString()}</span>
              {post.hidden && isAuthor && (
                <span className="rounded-full bg-whistle/10 px-2 py-0.5 text-[10px] font-medium text-whistle">Under review · only visible to you</span>
              )}
            </div>
            {isAuthor && !editing && (
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditText(post.content ?? ""); setEditing(true); }} aria-label="Edit post" className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-court hover:text-ink">
                  <Pencil size={13} />
                </button>
                <button onClick={deletePost} disabled={deleting} aria-label="Delete post" className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-whistle/10 hover:text-whistle">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="focus-ring w-full resize-none rounded-xl border border-court-line bg-court px-3 py-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            post.content?.trim() && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{post.content}</p>
          )}

          {post.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image} alt="" className="mt-3 max-h-96 w-full rounded-xl border border-court-line object-cover" />
          )}
          {post.images?.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {post.images.map((img: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" className="h-24 w-24 shrink-0 rounded-lg border border-court-line object-cover" />
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {post.sport && <Badge tone="volt">{post.sport}</Badge>}
            {post.tags?.map((t: string) => {
              const following = user?.followedTags?.includes(t);
              return (
                <span key={t} className="flex items-center overflow-hidden rounded-full bg-ink/5">
                  <button onClick={() => onTagClick(t)} className="focus-ring flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-ink-muted hover:text-volt">
                    <Hash size={10} /> {t}
                  </button>
                  <button
                    onClick={() => onFollowTag(t, !following)}
                    aria-label={following ? `Unfollow #${t}` : `Follow #${t}`}
                    className={`px-1.5 py-1 text-[11px] ${following ? "text-volt" : "text-ink-faint hover:text-volt"}`}
                    title={following ? "Following" : "Follow this tag"}
                  >
                    {following ? "★" : "☆"}
                  </button>
                </span>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-5 border-t border-court-line pt-3 text-xs text-ink-faint">
            <button onClick={toggleLike} className={`focus-ring flex items-center gap-1.5 ${liked ? "text-whistle" : "hover:text-ink"}`}>
              <Heart size={15} fill={liked ? "currentColor" : "none"} /> {likeCount}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="focus-ring flex items-center gap-1.5 hover:text-ink">
              <MessageCircle size={15} /> {post.comments}
            </button>
            <button onClick={toggleBookmark} className={`focus-ring flex items-center gap-1.5 ${bookmarked ? "text-volt" : "hover:text-ink"}`}>
              <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} /> {bookmarked ? "Saved" : "Save"}
            </button>
            <span className="flex items-center gap-1.5"><Share2 size={15} /> Share</span>
          </div>
          {showComments && <CommentThread postId={post.id} />}
        </div>
      </div>
    </Card>
  );
}

export default function CommunityPage() {
  const { user, refresh: refreshUser } = useAuth();
  const [filter, setFilter] = useState<Sport | "All">("All");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "trending" | "following">("newest");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const qs = new URLSearchParams();
  if (filter !== "All") qs.set("sport", filter);
  if (tagFilter) qs.set("tag", tagFilter);
  if (sort !== "newest") qs.set("sort", sort);
  const { data, loading, refresh } = useApiGet<{ posts: any[] }>(`/api/posts?${qs.toString()}`, [filter, tagFilter, sort]);
  const posts = data?.posts ?? [];

  async function followTag(tag: string, follow: boolean) {
    try {
      await apiPost("/api/users/me/followed-tags", { tag, follow });
      refreshUser();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) return alert(err);
    try {
      setImagePreview(await readAndCompressImage(file));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function submitPost() {
    if (!draft.trim() && !imagePreview) return;
    setPosting(true);
    try {
      await apiPost("/api/posts", {
        content: draft.trim(),
        sport: filter !== "All" ? filter : undefined,
        image: imagePreview ?? undefined,
      });
      setDraft("");
      setImagePreview(null);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="pb-16">
      <Topbar title="Community" />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_260px]">
        <div>
          <Card className="p-5">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-volt/20 text-sm font-bold text-volt overflow-hidden">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user?.name ?? "?").split(" ").map((n) => n[0]).join("")
                )}
              </span>
              <div className="w-full">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Share a match update, use #hashtags, find teammates, or start a discussion..."
                  className="focus-ring w-full resize-none rounded-xl border border-court-line bg-court px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-volt/50"
                />
                {imagePreview && (
                  <div className="relative mt-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Selected upload" className="max-h-52 rounded-xl border border-court-line object-cover" />
                    <button onClick={() => setImagePreview(null)} className="focus-ring absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow-card hover:bg-whistle" aria-label="Remove image">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
              <button onClick={() => fileInputRef.current?.click()} className="focus-ring flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-ink-muted hover:bg-ink/5">
                <ImagePlus size={15} /> {imagePreview ? "Change photo" : "Add photo"}
              </button>
              <Button size="sm" onClick={submitPost} disabled={posting}>
                {posting ? "Posting…" : "Post"} <Send size={14} />
              </Button>
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(["newest", "trending", "following"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`focus-ring rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sort === s ? "text-volt" : "text-ink-faint hover:text-ink"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => setFilter("All")} className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${filter === "All" ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}>
              All sports
            </button>
            {sports.map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${filter === s ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted hover:text-ink"}`}>
                {s}
              </button>
            ))}
            {tagFilter && (
              <button onClick={() => setTagFilter(null)} className="focus-ring flex items-center gap-1 rounded-full border border-volt bg-volt/10 px-3.5 py-1.5 text-xs font-medium text-volt">
                <Hash size={11} /> {tagFilter} <X size={11} />
              </button>
            )}
          </div>

          <div className="mt-6 space-y-5">
            {loading && <p className="text-sm text-ink-faint">Loading feed…</p>}
            {!loading && posts.length === 0 && <p className="text-sm text-ink-faint">No posts yet — be the first!</p>}
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onChange={refresh} onTagClick={setTagFilter} onFollowTag={followTag} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h3 className="font-display text-sm tracking-wide">SPORTS</h3>
            <div className="mt-3 space-y-2.5">
              {sports.slice(0, 5).map((s, i) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{i + 1}. {s}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-display text-sm tracking-wide">COMMUNITY GUIDELINES</h3>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Be respectful, keep match details accurate, and report any
              inappropriate content to help keep PlaySphere a positive space
              for Ahmedabad&apos;s sports community.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
