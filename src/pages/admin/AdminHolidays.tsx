
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { Plus, Trash2 } from 'lucide-react';
// import { Modal, Input, ConfirmDialog, EmptyState, Card } from '../../components/ui';
// import { PageHeader } from '../../components/common';
// import Button from '../../components/ui/Button';
// import toast from 'react-hot-toast';

// // ✅ API BASE URL
// const BASE_URL = "http://192.168.1.5:3000";

// interface Holiday {
//   id: string;
//   name: string;
//   date: string;
// }

// export default function AdminHolidays() {
//   const [holidays, setHolidays] = useState<Holiday[]>([]);
//   const [showForm, setShowForm] = useState(false);
//   const [deleting, setDeleting] = useState<Holiday | null>(null);

//   const [form, setForm] = useState({
//     name: '',
//     date: '',
//   });

//   // ✅ GET API
//   const fetchHolidays = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/getHolidays`);

//       console.log("API Response:", res.data);

//       const list = res.data.holidays || [];

//       const mapped = list.map((h: any) => ({
//         id: h.id || h._id || Math.random().toString(),
//         name: h.holidayName, // ✅ correct mapping
//         date: h.date,
//       }));

//       setHolidays(mapped);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to fetch holidays");
//     }
//   };

//   useEffect(() => {
//     fetchHolidays();
//   }, []);

//   // ✅ CREATE API
//   const handleCreate = async () => {
//   if (!form.name || !form.date) {
//     toast.error("Name and Date required");
//     return;
//   }

//   try {
//     const payload = {
//       holidays: [
//         {
//           holidayName: form.name,
//           date: form.date,
//         }
//       ]
//     };

//     console.log("Sending Payload:", payload); // 🔍 debug

//     const res = await axios.post(
//       "http://192.168.1.5:3000/createholidays",
//       payload
//     );

//     console.log("SUCCESS:", res.data);

//     // ✅ update UI
//     const newHoliday = {
//       id: res.data?.id || Math.random().toString(),
//       name: form.name,
//       date: form.date,
//     };

//     setHolidays(prev => [...prev, newHoliday]);

//     toast.success("Holiday added!");
//     setShowForm(false);
//     setForm({ name: '', date: '' });

//   } catch (err: any) {
//     console.error("ERROR:", err.response?.data || err.message);
//     toast.error("Create failed");
//   }
// };

//   // ✅ DELETE API
//   const handleDelete = async () => {
//     if (!deleting) return;

//     try {
//       await axios.delete(`${BASE_URL}/deleteholidays/${deleting.id}`);

//       setHolidays(prev => prev.filter(h => h.id !== deleting.id));

//       toast.success("Deleted successfully");
//       setDeleting(null);

//     } catch (err) {
//       console.error(err);
//       toast.error("Delete failed");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <PageHeader
//         title="Holiday Calendar"
//         subtitle="Manage holidays"
//         action={
//           <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
//             Add Holiday
//           </Button>
//         }
//       />

//       {/* LIST */}
//       <Card padding={false}>
//         {holidays.length === 0 && (
//           <EmptyState icon="🎉" message="No holidays found" />
//         )}

//         {holidays.map(h => (
//           <div key={h.id} className="flex justify-between items-center p-4 border-b">
//             <div>
//               <p className="font-semibold">{h.name}</p>
//               <p className="text-sm text-gray-500">{h.date}</p>
//             </div>

//             <button
//               onClick={() => setDeleting(h)}
//               className="text-red-500"
//             >
//               <Trash2 size={16} />
//             </button>
//           </div>
//         ))}
//       </Card>

//       {/* CREATE MODAL */}
//       {showForm && (
//         <Modal title="Add Holiday" onClose={() => setShowForm(false)}>
//           <div className="space-y-4">
//             <Input
//               label="Holiday Name"
//               value={form.name}
//               onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
//             />

//             <Input
//               type="date"
//               label="Date"
//               value={form.date}
//               onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
//             />

//             <div className="flex justify-end gap-2">
//               <Button onClick={() => setShowForm(false)}>Cancel</Button>
//               <Button onClick={handleCreate}>Create</Button>
//             </div>
//           </div>
//         </Modal>
//       )}

//       {/* DELETE CONFIRM */}
//       {deleting && (
//         <ConfirmDialog
//           message={`Delete ${deleting.name}?`}
//           onConfirm={handleDelete}
//           onCancel={() => setDeleting(null)}
//         />
//       )}
//     </div>
//   );
// }

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useHolidays } from '../../modules/holidays/useHolidays';
import { Modal, Input, ConfirmDialog, EmptyState, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminHolidays() {
  const { holidays, createHoliday, deleteHoliday } = useHolidays();

  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    date: '',
  });

  const handleCreate = async () => {
    if (!form.name || !form.date) {
      toast.error("Name and Date required");
      return;
    }

    const ok = await createHoliday(form);

    if (ok) {
      toast.success("Holiday added!");
      setShowForm(false);
      setForm({ name: '', date: '' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        subtitle="Manage holidays"
        action={
          <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
            Add Holiday
          </Button>
        }
      />

      <Card padding={false}>
        {holidays.length === 0 && (
          <EmptyState icon="🎉" message="No holidays found" />
        )}

        {holidays.map(h => (
          <div key={h.id} className="flex justify-between p-4 border-b">
            <div>
              <p className="font-semibold">{h.name}</p>
              <p className="text-sm text-gray-500">{h.date}</p>
            </div>

            <button onClick={() => setDeleting(h)} className="text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </Card>

      {showForm && (
        <Modal title="Add Holiday" onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />

            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Delete ${deleting.name}?`}
          onConfirm={async () => {
            await deleteHoliday(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}