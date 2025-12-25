import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  MapPin,
  User,
  Plus,
  Trophy,
  Music,
  Palette,
  Mic2,
  Clock,
  Trash2,
  X,
  Users,
  CheckCircle,
  Clock3,
  Edit2,
  Image as ImageIcon,
  Upload,
  Search,
  Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { ActivityRecord, ActivityType, UserRole } from '../types';

const Activities: React.FC = () => {
  const { t } = useLanguage();
  const { activityRecords, addActivity, updateActivity, deleteActivity, currentUser, students } = useData();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');
  const [viewParticipantsActivity, setViewParticipantsActivity] = useState<ActivityRecord | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [newActivity, setNewActivity] = useState<Partial<ActivityRecord>>({
    type: 'cultural',
    date: new Date().toISOString().split('T')[0],
    status: 'upcoming',
    images: [],
    participantIds: []
  });

  const canEdit =
    currentUser &&
    [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER].includes(currentUser.role);

  const filteredActivities = activityRecords.filter(
    a => filterType === 'ALL' || a.type === filterType
  );

  const upcomingCount = activityRecords.filter(a => a.status === 'upcoming').length;
  const completedCount = activityRecords.filter(a => a.status === 'completed').length;
  const totalParticipants = activityRecords.reduce(
    (sum, a) => sum + (a.participantsCount || 0),
    0
  );

  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'sport': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'cultural': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'religious': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'educational': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'sport': return <Trophy className="w-5 h-5" />;
      case 'cultural': return <Palette className="w-5 h-5" />;
      case 'religious': return <Mic2 className="w-5 h-5" />;
      case 'educational': return <BookOpen className="w-5 h-5" />;
      default: return <Music className="w-5 h-5" />;
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setNewActivity({
      type: 'cultural',
      date: new Date().toISOString().split('T')[0],
      status: 'upcoming',
      images: [],
      participantIds: []
    });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEdit = (activity: ActivityRecord) => {
    setIsEditing(true);
    setNewActivity({
      ...activity,
      images: activity.images || [],
      participantIds: activity.participantIds || []
    });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewActivity(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setNewActivity(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const toggleParticipant = (studentId: string) => {
    const ids = newActivity.participantIds || [];
    const newIds = ids.includes(studentId)
      ? ids.filter(id => id !== studentId)
      : [...ids, studentId];

    setNewActivity(prev => ({
      ...prev,
      participantIds: newIds
    }));
  };

  const handleSave = () => {
    if (!newActivity.title || !newActivity.date) return;

    const payload: ActivityRecord = {
      ...(newActivity as ActivityRecord),
      images: newActivity.images || [],
      participantIds: newActivity.participantIds || []
    };

    if (isEditing && payload.id) {
      updateActivity(payload);
    } else {
      addActivity({ ...payload, id: crypto.randomUUID() });
    }

    setShowModal(false);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* بقية JSX لم تتغير إطلاقًا */}
    </div>
  );
};

export default Activities;
