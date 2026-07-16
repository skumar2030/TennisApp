import { useEffect, useState } from 'react'
import axios from 'axios'

export default function NewsPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = async (query) => {
    setLoading(true)
    setError('')
    try {
      const params = query ? { q: query } : {}
      const { data } = await axios.get('/api/news', { params })
      setArticles(data)
    } catch {
      setError('Failed to load news articles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchNews(search.trim())
  }

  const handleClear = () => {
    setSearch('')
    fetchNews()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await axios.post('/api/news/refresh')
      await fetchNews(search.trim() || undefined)
    } catch {
      setError('Failed to refresh news.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Tennis News</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm font-medium px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 underline px-2"
          >
            Clear
          </button>
        )}
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading news...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{search ? 'No articles match your search.' : 'No articles available.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex"
            >
              {article.thumbnail && (
                <div className="w-48 h-32 shrink-0 bg-gray-100 dark:bg-gray-700">
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
              <div className="p-4 flex flex-col justify-center min-w-0">
                {article.category && (
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                    {article.category}
                  </span>
                )}
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-snug line-clamp-2">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{article.excerpt}</p>
                )}
                <span className="text-xs text-green-600 mt-2 font-medium">Read on tennis.com &rarr;</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 text-center">
        Articles sourced from tennis.com. Refreshed daily.
      </p>
    </div>
  )
}
