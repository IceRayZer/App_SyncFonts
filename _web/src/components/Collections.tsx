import React, { useState, useEffect } from 'react';
import { Plus, Folder, Trash2, Download, Eye } from 'lucide-react';
import { Collection, Font } from '../types';
import {
  getCollections,
  addCollection,
  deleteCollection,
  getFonts,
  getFontsOfCollection,
  addFontToCollection,
  removeFontFromCollection
} from '../services/supabaseService';
import { useUser } from './UserContext';

const Collections: React.FC = () => {
  const { user } = useUser();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionFonts, setCollectionFonts] = useState<Font[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  useEffect(() => {
    fetchCollections();
    fetchFonts();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      fetchCollectionFonts(selectedCollection.id);
    } else {
      setCollectionFonts([]);
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    const data = await getCollections();
    setCollections(data);
  };

  const fetchFonts = async () => {
    const data = await getFonts();
    setFonts(data);
  };

  const fetchCollectionFonts = async (collectionId: string) => {
    const data = await getFontsOfCollection(collectionId);
    setCollectionFonts(data);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !user) return;
    await addCollection({
      name: newCollectionName,
      description: newCollectionDescription,
      color: '#3B82F6',
      fontIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.id,
    });
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowCreateModal(false);
    fetchCollections();
  };

  const handleDeleteCollection = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      await deleteCollection(id);
      fetchCollections();
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    }
  };

  const handleAddFontToCollection = async (fontId: string) => {
    if (!selectedCollection) return;
    await addFontToCollection(selectedCollection.id, fontId);
    fetchCollectionFonts(selectedCollection.id);
  };

  const handleRemoveFontFromCollection = async (fontId: string) => {
    if (!selectedCollection) return;
    await removeFontFromCollection(selectedCollection.id, fontId);
    fetchCollectionFonts(selectedCollection.id);
  };

  // Export cloud (JSON)
  const handleExport = async (collection: Collection, format: 'csv' | 'json') => {
    const fontsToExport = await getFontsOfCollection(collection.id);
    let data = '';
    if (format === 'json') {
      data = JSON.stringify({
        collection: {
          name: collection.name,
          description: collection.description,
        },
        fonts: fontsToExport
      }, null, 2);
    } else {
      const headers = 'Name,Family,Style,Weight,Format,License,Category,Date Installed,Path';
      const rows = fontsToExport.map(font =>
        `"${font.name}","${font.family}","${font.style}",${font.weight},"${font.format}","${font.license}","${font.category}","${font.dateInstalled}","${font.path}"`
      );
      data = [headers, ...rows].join('\n');
    }
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
          <p className="text-gray-600 mt-1">Organize your fonts by project</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Collection</span>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collections List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Your Collections</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {collections.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No collections yet</p>
                  <p className="text-sm">Create your first collection</p>
                </div>
              ) : (
                collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCollection?.id === collection.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                    onClick={() => setSelectedCollection(collection)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: collection.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{collection.name}</h4>
                        <p className="text-sm text-gray-600 truncate">{collection.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Collection Details */}
        <div className="lg:col-span-2">
          {selectedCollection ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedCollection.color }}
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedCollection.name}</h3>
                      <p className="text-gray-600 mt-1">{selectedCollection.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExport(selectedCollection, 'csv')}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Export as CSV"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(selectedCollection.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collectionFonts.map((font) => (
                    <div key={font.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{font.name}</h4>
                          <p className="text-sm text-gray-600">{font.family}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveFontFromCollection(font.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove from collection"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p
                          className="text-lg text-gray-900 truncate"
                          style={{ fontFamily: font.family }}
                        >
                          Typography Sample
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {collectionFonts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No fonts in this collection</p>
                    <p className="text-sm">Add fonts from the library</p>
                  </div>
                )}
                {/* Ajout de police à la collection */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Ajouter une police à cette collection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fonts.filter(f => !collectionFonts.some(cf => cf.id === f.id)).map(font => (
                      <button
                        key={font.id}
                        onClick={() => handleAddFontToCollection(font.id)}
                        className="w-full text-left px-3 py-2 bg-blue-50 rounded hover:bg-blue-100"
                      >
                        {font.name} <span className="text-xs text-gray-500">({font.family})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Collection</h3>
              <p className="text-gray-600">Choose a collection from the left to view its details</p>
            </div>
          )}
        </div>
      </div>
      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Brand Project, Website Fonts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe this collection..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;