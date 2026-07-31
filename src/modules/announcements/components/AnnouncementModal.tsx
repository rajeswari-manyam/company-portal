// src/modules/announcements/components/AnnouncementModal.tsx

import { Modal } from '../../../components/ui';
import AnnouncementForm from './AnnouncementForm';

export default function AnnouncementModal({ open, onClose, onSubmit, user }: any) {
  if (!open) return null;

  return (
    <Modal title="New Announcement" onClose={onClose} size="lg">
      <AnnouncementForm
        createdBy={user}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}