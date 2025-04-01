'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Assuming shadcn/ui Select component
import { MoreHorizontal, Plus, Edit, Archive, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5002';

const fetchDocuments = async (token, search = '', category = '') => {
  const url = new URL(`${API_BASE_URL}/documents`);
  if (search) url.searchParams.append('title', search);
  if (category && category !== 'all') url.searchParams.append('category', category); // Skip "all"
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
};

const uploadDocument = async (formData, token) => {
  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to upload document');
  return result;
};

const DocumentsPage = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]); // For client-side filtering
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    version: '',
    revision: '',
    description: '',
    file: null,
  });
  const [search, setSearch] = useState(''); // Search input
  const [selectedCategory, setSelectedCategory] = useState('all'); // Default to "all"

  // Fetch unique categories for the filter dropdown
  const categories = [...new Set(documents.map((doc) => doc.category))];

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        if (!token) throw new Error('No token available');
        const data = await fetchDocuments(token);
        // Mock change request indicator (replace with real data later)
        const enrichedData = data.map((doc) => ({
          ...doc,
          hasChangeRequests: Math.random() > 0.5, // Mock: 50% chance for now
        }));
        setDocuments(enrichedData);
        setFilteredDocuments(enrichedData);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, [token]);

  // Filter documents based on search and category
  useEffect(() => {
    const filterDocs = () => {
      let result = documents;
      if (search) {
        result = result.filter((doc) =>
          doc.title.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (selectedCategory && selectedCategory !== 'all') {
        result = result.filter((doc) => doc.category === selectedCategory);
      }
      setFilteredDocuments(result);
    };
    filterDocs();
  }, [search, selectedCategory, documents]);

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      category: '',
      version: '',
      revision: '',
      description: '',
      file: null,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) form.append(key, formData[key]);
    });

    try {
      if (!token) throw new Error('No token available');
      const result = await uploadDocument(form, token);
      toast.success(result.message);
      setOpenDialog(false);
      const updatedDocs = await fetchDocuments(token);
      const enrichedDocs = updatedDocs.map((doc) => ({
        ...doc,
        hasChangeRequests: false, // New docs have no change requests initially
      }));
      setDocuments(enrichedDocs);
      setFilteredDocuments(enrichedDocs);
    } catch (error) {
      toast.error(error.message);
    }
  };

const handleView = (doc) => {
  const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${API_BASE_URL}${doc.fileUrl}`;
  console.log('File URL:', fullUrl); // Log the URL for debugging
  if (doc.fileUrl.endsWith('.pdf')) {
    setSelectedDoc(doc);
    setOpenViewDialog(true); // Open inline viewer for PDFs
  } else if (doc.fileUrl.endsWith('.docx')) {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
    console.log('Google Docs Viewer URL:', viewerUrl); // Log the viewer URL
    window.open(viewerUrl, '_blank');
  } else {
    window.open(fullUrl, '_blank'); // Fallback for other file types
  }
};
  const handleChangeRequest = (docId) => {
    router.push(`/documents/${docId}/change-requests`);
  };

  const handleEdit = (doc) => {
    toast.info('Edit functionality coming soon!');
  };

  const handleArchive = (docId) => {
    toast.info('Archive functionality coming soon!');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Policy Documents</h1>
        {user?.roleName?.toUpperCase() === 'MR' && (
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Document
          </Button>
        )}
      </div>

      {/* Search and Filter UI */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm border-gray-300 focus:border-blue-500"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px] border-gray-300">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem> {/* Use "all" instead of empty string */}
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="font-semibold text-gray-700">Title</TableHead>
            <TableHead className="font-semibold text-gray-700">Description</TableHead>
            <TableHead className="font-semibold text-gray-700">Category</TableHead>
            <TableHead className="font-semibold text-gray-700">Version</TableHead>
            <TableHead className="font-semibold text-gray-700">Revision</TableHead>
            <TableHead className="font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                Loading...
              </TableCell>
            </TableRow>
          ) : filteredDocuments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                No documents found
              </TableCell>
            </TableRow>
          ) : (
            filteredDocuments.map((doc, index) => (
              <TableRow key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <TableCell className="text-gray-800">{doc.title}</TableCell>
                <TableCell className="text-gray-600">{doc.description}</TableCell>
                <TableCell className="text-gray-800">{doc.category}</TableCell>
                <TableCell className="text-gray-800">{doc.version}</TableCell>
                <TableCell className="text-gray-800">{doc.revision}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      doc.hasChangeRequests ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={doc.hasChangeRequests ? 'Has change requests' : 'No change requests'}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleView(doc)}
                        className="text-blue-600 hover:bg-blue-100"
                      >
                        <FileText className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      {user?.roleName?.toUpperCase() === 'MR' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleChangeRequest(doc.id)}
                            className="text-green-600 hover:bg-green-100"
                          >
                            <FileText className="mr-2 h-4 w-4" /> Change Request
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(doc)}
                            className="text-yellow-600 hover:bg-yellow-100"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleArchive(doc.id)}
                            className="text-red-600 hover:bg-red-100"
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog for Create */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Add New Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-700">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-gray-700">Classification</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="version" className="text-gray-700">Version</Label>
              <Input
                id="version"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="revision" className="text-gray-700">Revision</Label>
              <Input
                id="revision"
                name="revision"
                value={formData.revision}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="file" className="text-gray-700">File (Required)</Label>
              <Input
                id="file"
                name="file"
                type="file"
                onChange={handleFileChange}
                required
                className="border-gray-300"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for View */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-gray-800">
              {selectedDoc?.title} ({selectedDoc?.category} - v{selectedDoc?.version} r{selectedDoc?.revision})
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4 overflow-auto">
            {selectedDoc && (
              <iframe
                src={`${API_BASE_URL}${selectedDoc.fileUrl}`}
                className="w-full h-[75vh] border-none"
                title={selectedDoc.title}
              />
            )}
          </div>
          <DialogFooter className="p-4 border-t">
            <Button
              onClick={() => setOpenViewDialog(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPage;