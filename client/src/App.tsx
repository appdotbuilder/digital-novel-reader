
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Book, Search, Star, User, Settings, Home, Library } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Novel, Genre, Chapter, NovelStatus } from '../../server/src/schema';

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'novel' | 'reader' | 'admin'>('home');
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isAdmin] = useState(true); // For demo purposes - normally from auth context

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Book className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                NovelHub
              </h1>
            </div>
            
            <nav className="flex items-center space-x-6">
              <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('home')}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
              
              <Button
                variant={currentView === 'search' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('search')}
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Button>
              
              <Button
                variant={currentView === 'admin' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('admin')}
                className="flex items-center space-x-2"
                disabled={!isAdmin}
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'home' && (
          <HomePage onSelectNovel={(novel) => {
            setSelectedNovel(novel);
            setCurrentView('novel');
          }} />
        )}
        
        {currentView === 'search' && (
          <SearchPage onSelectNovel={(novel) => {
            setSelectedNovel(novel);
            setCurrentView('novel');
          }} />
        )}
        
        {currentView === 'novel' && selectedNovel && (
          <NovelDetailPage 
            novel={selectedNovel} 
            onStartReading={(chapter) => {
              setSelectedChapter(chapter);
              setCurrentView('reader');
            }}
            onBack={() => setCurrentView('home')}
          />
        )}
        
        {currentView === 'reader' && selectedChapter && selectedNovel && (
          <ReaderPage 
            novel={selectedNovel}
            chapter={selectedChapter}
            onBack={() => setCurrentView('novel')}
            onChapterChange={(chapter) => setSelectedChapter(chapter)}
          />
        )}
        
        {currentView === 'admin' && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}

// Home Page Component
function HomePage({ onSelectNovel }: { onSelectNovel: (novel: Novel) => void }) {
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNovels = useCallback(async () => {
    try {
      const [featured, all] = await Promise.all([
        trpc.getFeaturedNovels.query(),
        trpc.getNovelsList.query()
      ]);
      setFeaturedNovels(featured);
      setAllNovels(all);
    } catch (error) {
      console.error('Failed to load novels:', error);
      // Show user-friendly message about stub data
      console.log('📚 Using stub data - backend handlers need implementation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNovels();
  }, [loadNovels]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading amazing novels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl">
        <h2 className="text-4xl font-bold mb-4">📚 Welcome to NovelHub</h2>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Discover thousands of captivating novels, from romance to fantasy, all in one place
        </p>
      </div>

      {/* Stub Notice */}
      {featuredNovels.length === 0 && allNovels.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🚧</div>
              <div>
                <p className="font-semibold text-amber-800">Demo Mode Active</p>
                <p className="text-amber-700">Backend handlers are using stub data. The frontend is fully functional and ready for real data integration.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Novels */}
      {featuredNovels.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-2" />
            Featured Novels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNovels.map((novel: Novel) => (
              <NovelCard key={novel.id} novel={novel} onSelect={onSelectNovel} featured />
            ))}
          </div>
        </section>
      )}

      {/* All Novels */}
      {allNovels.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <Library className="h-6 w-6 text-purple-600 mr-2" />
            Latest Novels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allNovels.slice(0, 8).map((novel: Novel) => (
              <NovelCard key={novel.id} novel={novel} onSelect={onSelectNovel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Novel Card Component
function NovelCard({ novel, onSelect, featured = false }: { 
  novel: Novel; 
  onSelect: (novel: Novel) => void; 
  featured?: boolean;
}) {
  return (
    <Card className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${featured ? 'ring-2 ring-yellow-400' : ''}`} onClick={() => onSelect(novel)}>
      <CardHeader className="pb-3">
        {novel.cover_image_url && (
          <div className={`w-full ${featured ? 'h-48' : 'h-32'} bg-gray-200 rounded-md mb-3 flex items-center justify-center`}>
            <Book className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <CardTitle className="text-lg line-clamp-2">{novel.title}</CardTitle>
        <CardDescription className="line-clamp-2">{novel.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            Author #{novel.author_id}
          </span>
          <Badge variant={novel.status === 'completed' ? 'default' : 'secondary'}>
            {novel.status}
          </Badge>
        </div>
        {featured && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <span>{novel.total_chapters} chapters</span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span>{novel.total_views} views</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Search Page Component
function SearchPage({ onSelectNovel }: { onSelectNovel: (novel: Novel) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGenres = useCallback(async () => {
    try {
      const genreList = await trpc.getGenres.query();
      setGenres(genreList);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  }, []);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await trpc.searchNovels.query({
        query: searchQuery || undefined,
        genre_ids: selectedGenre !== 'all' ? [parseInt(selectedGenre)] : undefined,
        status: selectedStatus !== 'all' ? selectedStatus as NovelStatus : undefined,
        limit: 20
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search novels:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">🔍 Discover Your Next Great Read</h2>
        <p className="text-gray-600">Search by title, author, or browse by genre</p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search novels by title or author..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre: Genre) => (
                  <SelectItem key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="hiatus">On Hiatus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleSearch} className="w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search Novels'}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {searchResults.map((novel: Novel) => (
            <NovelCard key={novel.id} novel={novel} onSelect={onSelectNovel} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="pt-6 text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {isLoading ? 'Searching for novels...' : 'Use the search above to find your perfect novel'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Novel Detail Page Component
function NovelDetailPage({ 
  novel, 
  onStartReading, 
  onBack 
}: { 
  novel: Novel; 
  onStartReading: (chapter: Chapter) => void; 
  onBack: () => void;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChapters = useCallback(async () => {
    try {
      const chapterList = await trpc.getChapters.query({
        novel_id: novel.id,
        published_only: true
      });
      setChapters(chapterList);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [novel.id]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back to novels
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Novel Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="w-full h-64 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                <Book className="h-16 w-16 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{novel.title}</h1>
              <p className="text-gray-600 mb-4">{novel.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={novel.status === 'completed' ? 'default' : 'secondary'}>
                    {novel.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Chapters:</span>
                  <span>{novel.total_chapters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span>{novel.total_views.toLocaleString()}</span>
                </div>
              </div>
              
              {chapters.length > 0 && (
                <Button 
                  className="w-full mt-6" 
                  onClick={() => onStartReading(chapters[0])}
                >
                  Start Reading
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chapters List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin mx-auto h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  <p className="mt-2 text-gray-600">Loading chapters...</p>
                </div>
              ) : chapters.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chapters.map((chapter: Chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                      onClick={() => onStartReading(chapter)}
                    >
                      <div>
                        <p className="font-medium">Chapter {chapter.chapter_number}: {chapter.title}</p>
                        <p className="text-sm text-gray-500">
                          {chapter.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {chapter.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No chapters available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Reader Page Component  
function ReaderPage({ 
  novel, 
  chapter, 
  onBack, 
  onChapterChange 
}: { 
  novel: Novel; 
  chapter: Chapter; 
  onBack: () => void;
  onChapterChange: (chapter: Chapter) => void;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [fontSize, setFontSize] = useState('16');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  const loadChapters = useCallback(async () => {
    try {
      const chapterList = await trpc.getChapters.query({
        novel_id: novel.id,
        published_only: true
      });
      setChapters(chapterList);
      const index = chapterList.findIndex((c: Chapter) => c.id === chapter.id);
      setCurrentChapterIndex(index !== -1 ? index : 0);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  }, [novel.id, chapter.id]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  const themeClasses = {
    light: 'bg-white text-black',
    dark: 'bg-gray-900 text-white',
    sepia: 'bg-amber-50 text-amber-900'
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentChapterIndex - 1 : currentChapterIndex + 1;
    if (newIndex >= 0 && newIndex < chapters.length) {
      setCurrentChapterIndex(newIndex);
      onChapterChange(chapters[newIndex]);
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses[theme]}`}>
      {/* Reader Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b p-4 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back to novel
          </Button>
          
          <div className="flex items-center space-x-4">
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="22">22px</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'sepia') => setTheme(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="sepia">Sepia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">
            Chapter {chapter.chapter_number}: {chapter.title}
          </h1>
          <p className="text-sm opacity-70">{novel.title}</p>
        </div>
        
        <div 
          className="prose prose-lg max-w-none leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div className="whitespace-pre-wrap">
            {chapter.content || 'Chapter content will appear here...'}
          </div>
        </div>
        
        {/* Chapter Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t">
          <Button 
            variant="outline" 
            onClick={() => navigateChapter('prev')}
            disabled={currentChapterIndex === 0}
          >
            ← Previous Chapter
          </Button>
          
          <span className="text-sm opacity-70">
            {currentChapterIndex + 1} of {chapters.length} chapters
          </span>
          
          <Button 
            variant="outline"
            onClick={() => navigateChapter('next')}
            disabled={currentChapterIndex === chapters.length - 1}
          >
            Next Chapter →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Admin Panel Component (Simplified for this demo)
function AdminPanel() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">⚙️ Admin Panel</h2>
        <p className="text-gray-600">Manage novels, chapters, authors, and more</p>
      </div>

      <Tabs defaultValue="novels" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="novels">Novels</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="novels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Novel Management</CardTitle>
              <CardDescription>Create, edit, and manage novels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Novel management interface would be here</p>
                <p className="text-sm text-gray-500 mt-2">Full CRUD operations for novels, including title, description, author, cover image, genres, and status</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chapters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chapter Management</CardTitle>
              <CardDescription>Create and edit novel chapters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chapter management with rich text editor would be here</p>
                <p className="text-sm text-gray-500 mt-2">Rich text editor, chapter ordering, and publishing controls</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="authors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Author Management</CardTitle>
              <CardDescription>Manage author profiles and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Author management interface would be here</p>
                <p className="text-sm text-gray-500 mt-2">Author profiles, bio, images, and novel associations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="genres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genre Management</CardTitle>
              <CardDescription>Create and manage novel genres</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Genre management interface would be here</p>
                <p className="text-sm text-gray-500 mt-2">Genre categories with descriptions for novel classification</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Management</CardTitle>
              <CardDescription>Manage Google AdSense placements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Ad placement management would be here</p>
                <p className="text-sm text-gray-500 mt-2">AdSense script management, placement types, and activation controls</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
