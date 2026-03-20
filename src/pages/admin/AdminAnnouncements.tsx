
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { Plus, Trash2 } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import AnnouncementCard from '../../modules/announcements/components/AnnouncementCard';
// import AnnouncementForm from '../../modules/announcements/components/AnnouncementForm';
// import { Modal, SearchInput, Select, EmptyState } from '../../components/ui';
// import { PageHeader } from '../../components/common';
// import Button from '../../components/ui/Button';
// import toast from 'react-hot-toast';

// // ✅ API BASE
// const BASE_URL = "http://192.168.1.5:3000";

// export default function AdminAnnouncements() {
//   const { user } = useAuth();

//   const [announcements, setAnnouncements] = useState<any[]>([]);
//   const [search, setSearch] = useState('');
//   const [priorityFilter, setPriorityFilter] = useState('all');
//   const [showForm, setShowForm] = useState(false);

//   // ✅ GET API
//   const fetchAnnouncements = async () => {
//   try {
//     const res = await axios.get(`${BASE_URL}/getAnnouncementAll`);

//     console.log("API RESPONSE:", res.data); // 🔍 MUST CHECK

//     // ✅ handle all formats
//     const list = Array.isArray(res.data)
//       ? res.data
//       : res.data.announcements || res.data.data || [];

//     const mapped = list.map((a: any) => ({
//       id: a.id || a._id,
//       title: a.title,
//       message: a.message,
//       departments: a.departments,
//       isForAll: a.isForAll,
//       priority: a.priority || "medium",
//       createdAt: a.createdAt,
//     }));

//     setAnnouncements(mapped);

//   } catch (err) {
//     console.error("GET ERROR:", err);
//     toast.error("Failed to fetch announcements");
//   }
// };

//   useEffect(() => {
//     fetchAnnouncements();
//   }, []);

//   // ➕ CREATE API
//  const handleCreate = async (data: any) => {
//   try {
//     console.log("FORM DATA:", data); // 🔍 MUST CHECK

//     const payload = {
//       // ✅ FIX FIELD MAPPING
//       title: data.title || data.name,
//       message: data.message || data.description,

//       // ✅ FIX SPELLING ALSO
//       departments: data.departments || "consultancy",

//       isForAll: data.isForAll ?? false,
//     };

//     console.log("FINAL PAYLOAD:", payload); // 🔍 DEBUG

//     const res = await axios.post(
//       `${BASE_URL}/addAnnouncement`,
//       payload
//     );

//     const newItem = {
//       id: res.data.id || res.data._id || Math.random().toString(),
//       ...payload,
//       priority: data.priority || "medium",
//     };

//     setAnnouncements(prev => [newItem, ...prev]);

//     toast.success("Announcement created!");
//     return true;

//   } catch (err: any) {
//     console.error("ERROR:", err.response?.data || err.message);
//     toast.error(err.response?.data?.message || "Create failed");
//     return false;
//   }
// };

//   // 🗑 DELETE API
//   const handleDelete = async (id: string) => {
//     try {
//       await axios.delete(`${BASE_URL}/deleteAnnouncementById/${id}`);

//       setAnnouncements(prev => prev.filter(a => a.id !== id));

//       toast.success("Deleted successfully");
//     } catch (err) {
//       console.error(err);
//       toast.error("Delete failed");
//     }
//   };

//   // 🔍 FILTER
//   const filtered = announcements.filter(a => {
//     const matchSearch =
//       a.title.toLowerCase().includes(search.toLowerCase()) ||
//       a.message.toLowerCase().includes(search.toLowerCase());

//     const matchPriority =
//       priorityFilter === 'all' || a.priority === priorityFilter;

//     return matchSearch && matchPriority;
//   });

//   const priorityOptions = [
//     { value: 'all', label: 'All Priorities' },
//     { value: 'high', label: '🔴 High' },
//     { value: 'medium', label: '🟡 Medium' },
//     { value: 'low', label: '🟢 Low' },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <PageHeader
//         title="Announcements"
//         subtitle="Post and manage company-wide announcements"
//         action={
//           <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
//             New Announcement
//           </Button>
//         }
//       />

//       {/* SEARCH + FILTER */}
//       <div className="flex flex-wrap gap-3">
//         <SearchInput
//           value={search}
//           onChange={setSearch}
//           placeholder="Search announcements…"
//           className="flex-1 min-w-[200px]"
//         />
//         <Select
//           value={priorityFilter}
//           onChange={e => setPriorityFilter(e.target.value)}
//           options={priorityOptions}
//           className="w-44"
//         />
//       </div>

//       {/* LIST */}
//       {filtered.length === 0 ? (
//         <EmptyState icon="📢" message="No announcements found" />
//       ) : (
//         <div className="space-y-4">
//           {filtered.map(a => (
//             <AnnouncementCard
//               key={a.id}
//               announcement={a}
//               canDelete
//               onDelete={() => handleDelete(a.id)}
//             />
//           ))}
//         </div>
//       )}

//       {/* CREATE MODAL */}
//       {showForm && (
//         <Modal title="New Announcement" onClose={() => setShowForm(false)} size="lg">
//           <AnnouncementForm
//             createdBy={user?.name ?? 'Admin'}
//             onSubmit={async (data) => {
//               const ok = await handleCreate(data);
//               if (ok) setShowForm(false);
//               return ok;
//             }}
//             onCancel={() => setShowForm(false)}
//           />
//         </Modal>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AnnouncementCard from '../../modules/announcements/components/AnnouncementCard';
import AnnouncementForm from '../../modules/announcements/components/AnnouncementForm';
import { Modal, SearchInput, Select, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

// ✅ API IMPORTS
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../../services/announcementApi';

export default function AdminAnnouncements() {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ GET
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("GET ERROR:", err);
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ➕ CREATE
  const handleCreate = async (data: any) => {
    try {
      const newItem = await createAnnouncement(data);

      setAnnouncements(prev => [newItem, ...prev]);

      toast.success("Announcement created!");
      return true;
    } catch (err: any) {
      console.error("CREATE ERROR:", err.response?.data || err.message);
      toast.error("Create failed");
      return false;
    }
  };

  // 🗑 DELETE
  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);

      setAnnouncements(prev => prev.filter(a => a.id !== id));

      toast.success("Deleted successfully");
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error("Delete failed");
    }
  };

  // 🔍 FILTER
  const filtered = announcements.filter(a => {
    const matchSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase());

    const matchPriority =
      priorityFilter === 'all' || a.priority === priorityFilter;

    return matchSearch && matchPriority;
  });

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: '🔴 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Announcements"
        subtitle="Post and manage company-wide announcements"
        action={
          <Button
            icon={<Plus size={16} />}
            onClick={() => setShowForm(true)}
          >
            New Announcement
          </Button>
        }
      />

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search announcements…"
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          options={priorityOptions}
          className="w-44"
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-6 text-slate-500">
          Loading announcements...
        </div>
      )}

      {/* LIST */}
      {!loading && filtered.length === 0 ? (
        <EmptyState icon="📢" message="No announcements found" />
      ) : (
        <div className="space-y-4">
          {filtered.map(a => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              canDelete
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showForm && (
        <Modal
          title="New Announcement"
          onClose={() => setShowForm(false)}
          size="lg"
        >
          <AnnouncementForm
            createdBy={user?.name ?? 'Admin'}
            onSubmit={async (data) => {
              const ok = await handleCreate(data);
              if (ok) setShowForm(false);
              return ok;
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}