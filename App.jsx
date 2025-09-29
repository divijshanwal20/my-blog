import React, { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'myblog_posts_v1'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
function formatDate(ts) {
  return new Date(ts).toLocaleString()
}
function sanitize(text) {
  return text.replace(/<[^>]*>/g, '')
}
function md(text) {
  let t = sanitize(text)
  t = t.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 border">\$1</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  t = t.replace(/^###\s(.+)$/gm, '<h3 class="text-lg font-semibold mt-4">$1</h3>')
  t = t.replace(/^##\s(.+)$/gm, '<h2 class="text-xl font-bold mt-6">$1</h2>')
  t = t.replace(/^#\s(.+)$/gm, '<h1 class="text-2xl font-extrabold mt-8">$1</h1>')
  t = t.replace(/^\s*[-*]\s(.+)$/gm, '<li>$1</li>')
  t = t.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc list-inside my-3">$1</ul>')
  t = t
    .split(/\n{2,}/)
    .map((p) => (p.match(/^<h[1-3]|<ul|<li|<code|<strong|<em/) ? p : `<p class="my-3 leading-7">${p.replace(/\n/g, '<br/>')}</p>`))
    .join('\n')
  return t
}

function useLocalStoragePosts() {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPosts(JSON.parse(raw))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    } catch {}
  }, [posts])
  return [posts, setPosts]
}

export default function App() {
  const [posts, setPosts] = useLocalStoragePosts()
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [publishedOnly, setPublishedOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [tab, setTab] = useState('write')

  const titleRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return posts
      .filter((p) => (publishedOnly ? p.published : true))
      .filter((p) => !q ? true : p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.join(',').toLowerCase().includes(q))
      .sort((a, b) => (sortDesc ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt))
  }, [posts, publishedOnly, query, sortDesc])

  useEffect(() => { if (titleRef.current) titleRef.current.focus() }, [editingId])

  function clearEditor() {
    setEditingId(null); setTitle(''); setTags(''); setContent('')
  }
  function startNew() { clearEditor(); setTimeout(() => titleRef.current?.focus(), 0) }
  function loadForEdit(p) {
    setEditingId(p.id); setTitle(p.title); setTags(p.tags.join(', ')); setContent(p.content); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function save(publishNow=false) {
    const now = Date.now()
    const tagList = tags.split(',').map(t=>t.trim()).filter(Boolean)
    if (!title.trim()) { alert('Please add a title'); return }
    if (editingId) {
      setPosts(prev => prev.map(p => p.id===editingId ? { ...p, title: title.trim(), content, tags: tagList, updatedAt: now, published: publishNow ? true : p.published } : p))
    } else {
      const p = { id: uid(), title: title.trim(), content, tags: tagList, createdAt: now, updatedAt: now, published: publishNow }
      setPosts(prev => [p, ...prev])
    }
    if (publishNow) setPublishedOnly(false)
    clearEditor()
  }
  function togglePublish(p) { setPosts(prev => prev.map(x => x.id===p.id ? { ...x, published: !x.published, updatedAt: Date.now() } : x)) }
  function remove(p) {
    if (!confirm(`Delete “${p.title}”?`)) return
    setPosts(prev => prev.filter(x => x.id !== p.id))
    if (editingId === p.id) clearEditor()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-black text-white grid place-items-center font-bold">B</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">My Mini Blog</h1>
              <p className="text-xs text-gray-500">Write, preview, and publish — no backend required.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{
              const blob = new Blob([JSON.stringify(posts, null, 2)], {type:'application/json'})
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href=url; a.download=`blog-posts-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url)
            }} className="px-3 py-2 text-sm border rounded-2xl bg-white hover:bg-gray-50">Export</button>
            <button onClick={()=>{
              const inp = document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange=()=>{
                const f = inp.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const parsed=JSON.parse(String(r.result)); if(Array.isArray(parsed)) setPosts(parsed) } catch{} }; r.readAsText(f)
              }; inp.click()
            }} className="px-3 py-2 text-sm border rounded-2xl bg-white hover:bg-gray-50">Import</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-4">
          <div className="rounded-2xl shadow-sm border bg-white">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={startNew} className="px-3 py-1.5 text-sm border rounded-xl bg-white hover:bg-gray-50">New</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
                <input id="title" ref={titleRef} value={title} onChange={e=>setTitle(e.target.value)} placeholder="A catchy headline..." className="w-full h-11 px-3 rounded-2xl border" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tags">Tags</label>
                <input id="tags" value={tags} onChange={e=>setTags(e.target.value)} placeholder="e.g. react, life, travel" className="w-full h-11 px-3 rounded-2xl border" />
              </div>

              <div className="flex gap-2">
                <button onClick={()=>setTab('write')} className={`px-3 py-1.5 text-sm rounded-xl border ${tab==='write'?'bg-gray-900 text-white':'bg-white'}`}>Write</button>
                <button onClick={()=>setTab('preview')} className={`px-3 py-1.5 text-sm rounded-xl border ${tab==='preview'?'bg-gray-900 text-white':'bg-white'}`}>Preview</button>
              </div>

              {tab==='write' ? (
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="content">Content</label>
                  <textarea id="content" value={content} onChange={e=>setContent(e.target.value)} placeholder="Use *italic*, **bold**, `code`, lists with - ..." className="w-full min-h-[280px] p-3 rounded-2xl border" />
                </div>
              ) : (
                <div className="prose max-w-none border rounded-2xl p-4 bg-white">
                  {content.trim() ? <article dangerouslySetInnerHTML={{__html: md(content)}} /> : <p className="text-gray-500">Nothing to preview yet…</p>}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-xs text-gray-500">Autosaves locally in your browser.</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>save(false)} className="px-3 py-2 text-sm border rounded-2xl bg-white hover:bg-gray-50">Save Draft</button>
                <button onClick={()=>save(true)} className="px-3 py-2 text-sm border rounded-2xl bg-black text-white hover:opacity-90">Publish</button>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border bg-white">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Posts</h3>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPublishedOnly(false)} className="px-2 py-1 text-xs border rounded-lg bg-white">All</button>
                <button onClick={()=>setPublishedOnly(true)} className="px-2 py-1 text-xs border rounded-lg bg-white">Published</button>
                <button onClick={()=>setSortDesc(s=>!s)} className="px-2 py-1 text-xs border rounded-lg bg-white">Toggle sort</button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <input placeholder="Search title, content, tags…" value={query} onChange={e=>setQuery(e.target.value)} className="w-full pl-3 h-10 rounded-2xl border" />
              </div>
              <div className="space-y-3">
                {filtered.map(p => (
                  <div key={p.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-base truncate">{p.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${p.published ? 'bg-black text-white border-black' : 'bg-gray-100'}`}>{p.published ? 'Published' : 'Draft'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Updated {formatDate(p.updatedAt)}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.tags.map(t => <span key={t+p.id} className="text-xs px-2 py-0.5 rounded-full border bg-white">#{t}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={()=>loadForEdit(p)} className="px-2 py-1 text-xs border rounded-lg bg-white">Edit</button>
                        <button onClick={()=>togglePublish(p)} className="px-2 py-1 text-xs border rounded-lg bg-white">{p.published ? 'Unpublish' : 'Publish'}</button>
                        <button onClick={()=>remove(p)} className="px-2 py-1 text-xs border rounded-lg bg-white">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length===0 && <div className="text-sm text-gray-500">No posts yet. Create your first one!</div>}
              </div>
            </div>
            <div className="p-4 border-t text-xs text-gray-500">{posts.length} total • {filtered.length} shown</div>
          </div>

          <div className="rounded-2xl border bg-white">
            <div className="p-4 border-b"><h3 className="font-semibold">How to Publish</h3></div>
            <div className="p-4 text-sm text-gray-600 space-y-2">
              <p>This app stores everything in your browser using localStorage. To put it on the web:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Export a JSON backup of posts.</li>
                <li>Deploy on Vercel/Netlify/GitHub Pages.</li>
                <li>Optionally wire up a headless CMS later.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} • Your Name</div>
          <div className="flex items-center gap-3">
            <a className="hover:underline" href="#">About</a>
            <a className="hover:underline" href="#">Contact</a>
            <a className="hover:underline" href="#">RSS</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
