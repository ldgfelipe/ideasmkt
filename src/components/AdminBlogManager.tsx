import { useEffect, useState } from 'react';
import { useSession, type Session } from '../lib/session';
import AdminShell from './admin/AdminShell';
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  type FirestorePost
} from '../lib/firestore-blog';
import { Timestamp } from 'firebase/firestore';

type ViewMode = 'list' | 'create' | 'edit';

const emptyPost: Omit<FirestorePost, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  description: '',
  content: '',
  pubDate: null,
  author: '',
  tags: [],
  readingTime: '5 min',
  coverUrl: '',
  coverPath: ''
};

export default function AdminBlogManager() {
  const session: Session = useSession();
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [view, setView] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [tagsInput, setTagsInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session.isAdmin) return;
    loadPosts();
  }, [session.isAdmin]);

  async function loadPosts() {
    try {
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  }

  function startCreate() {
    setForm(emptyPost);
    setTagsInput('');
    setCoverFile(null);
    setCoverPreview('');
    setEditingId(null);
    setView('create');
    setError('');
  }

  function startEdit(post: FirestorePost) {
    setForm({
      title: post.title,
      description: post.description,
      content: post.content,
      pubDate: post.pubDate,
      author: post.author,
      tags: post.tags,
      readingTime: post.readingTime,
      coverUrl: post.coverUrl,
      coverPath: post.coverPath
    });
    setTagsInput(post.tags.join(', '));
    setCoverFile(null);
    setCoverPreview(post.coverUrl);
    setEditingId(post.id || null);
    setView('edit');
    setError('');
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCoverPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Título y contenido son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const postData = {
      ...form,
      tags,
      pubDate: form.pubDate || Timestamp.now()
    };

    try {
      if (editingId) {
        await updatePost(editingId, postData, coverFile || undefined);
      } else {
        await createPost(postData, coverFile || undefined);
      }
      setView('list');
      setEditingId(null);
      await loadPosts();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el post.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este post?')) return;
    try {
      await deletePost(id);
      await loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <AdminShell session={session} current="/admin/blog">
        {view === 'list' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">{posts.length} artículos</p>
              <button
                onClick={startCreate}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                + Nuevo artículo
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
                <p className="text-gray-500 mb-4">No hay artículos todavía.</p>
                <button
                  onClick={startCreate}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Crear el primer artículo
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left p-4 font-medium">Título</th>
                        <th className="text-left p-4 font-medium">Autor</th>
                        <th className="text-left p-4 font-medium">Fecha</th>
                        <th className="text-left p-4 font-medium">Tags</th>
                        <th className="text-right p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {posts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900 max-w-xs truncate">
                            {post.title}
                          </td>
                          <td className="p-4 text-gray-600">{post.author}</td>
                          <td className="p-4 text-gray-600">
                            {post.pubDate
                              ? dateFormatter.format(post.pubDate.toDate())
                              : '—'}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{post.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => startEdit(post)}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(post.id!)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {view === 'create' ? 'Nuevo artículo' : 'Editar artículo'}
              </h2>
              <button
                onClick={() => setView('list')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancelar
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Título del artículo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Breve descripción del artículo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) =>
                      setForm({ ...form, author: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nombre del autor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo de lectura
                  </label>
                  <input
                    type="text"
                    value={form.readingTime}
                    onChange={(e) =>
                      setForm({ ...form, readingTime: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="5 min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (separados por coma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="SEO, Marketing, Google"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen de portada
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="Preview"
                    className="mt-3 h-40 w-full object-cover rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido (Markdown) *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={16}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="# Título del artículo&#10;&#10;Contenido aquí..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setView('list')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Actualizar'
                      : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminShell>
  );
}
