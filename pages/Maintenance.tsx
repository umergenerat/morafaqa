import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { MaintenanceRequest, MaintenanceType, PriorityLevel, UserRole } from '../types';
import * as Permissions from '../utils/permissions';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle, Hammer, X, Trash2, ChevronDown, Calendar, Send, MessageCircle, Phone, Bell, Edit2 } from 'lucide-react';

const Maintenance: React.FC = () => {
    const { maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, currentUser, users } = useData();
    const { t, language } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

    // Editing State
    const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
    const [tempEditData, setTempEditData] = useState<MaintenanceRequest | null>(null);
    const [editReason, setEditReason] = useState('');

    const [newRequest, setNewRequest] = useState<Partial<MaintenanceRequest>>({
        type: 'plumbing',
        priority: 'medium',
        status: 'pending',
        dateReported: new Date().toISOString().split('T')[0]
    });

    // Notification State
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [lastCreatedRequest, setLastCreatedRequest] = useState<MaintenanceRequest | null>(null);
    const [selectedRecipientId, setSelectedRecipientId] = useState('');
    const [notificationChannel, setNotificationChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
    const [notificationNotes, setNotificationNotes] = useState('');

    const canUpdateStatus = Permissions.canManageMaintenance(currentUser);
    const canDelete = Permissions.canManageMaintenance(currentUser);
    // const canEdit = Permissions.canViewAllStudents(currentUser) && !Permissions.isParent(currentUser);

    const filteredRequests = maintenanceRequests.filter(req =>
        filterStatus === 'all' || req.status === filterStatus
    ).sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());

    const handleOpenModal = () => {
        setNewRequest({
            type: 'plumbing',
            priority: 'medium',
            status: 'pending',
            title: '',
            location: '',
            description: '',
            dateReported: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handleSaveNew = () => {
        if (!newRequest.title || !newRequest.location) return;

        const request: MaintenanceRequest = {
            id: crypto.randomUUID(),
            title: newRequest.title,
            type: newRequest.type as MaintenanceType,
            location: newRequest.location,
            description: newRequest.description || '',
            priority: newRequest.priority as PriorityLevel,
            status: 'pending',
            dateReported: newRequest.dateReported || new Date().toISOString().split('T')[0],
            reporterName: currentUser?.name || ''
        };

        addMaintenanceRequest(request);
        setShowModal(false);

        // Show notification modal after saving
        setLastCreatedRequest(request);
        // Auto-select first bursar if available
        const bursars = users.filter(u => u.role === UserRole.BURSAR);
        if (bursars.length > 0) {
            setSelectedRecipientId(bursars[0].id);
        }
        setShowNotifyModal(true);
    };

    const handleEditClick = (req: MaintenanceRequest) => {
        setEditingRequest(req);
        setTempEditData({ ...req });
        setEditReason('');
    };

    const handleSaveEdit = () => {
        if (!tempEditData || !editingRequest) return;

        // Check for changes
        const originalSnapshot: any = editingRequest.originalValues || {};
        let hasChanges = false;
        let updatedRequest = { ...tempEditData } as MaintenanceRequest;

        const fields = ['title', 'location', 'description', 'status', 'priority'] as const;

        fields.forEach(field => {
            if (tempEditData[field] !== editingRequest[field]) {
                hasChanges = true;
                if (!originalSnapshot[field]) {
                    originalSnapshot[field] = editingRequest[field];
                }
                if (originalSnapshot[field] === tempEditData[field]) {
                    delete originalSnapshot[field];
                }
            }
        });

        updatedRequest = {
            ...updatedRequest,
            originalValues: Object.keys(originalSnapshot).length > 0 ? originalSnapshot : undefined,
            modifiedBy: hasChanges ? currentUser?.name : editingRequest.modifiedBy,
            modificationDate: hasChanges ? new Date().toISOString() : editingRequest.modificationDate,
            modificationReason: hasChanges ? editReason : editingRequest.modificationReason
        };

        // Notification Logic (If not Admin)
        if (hasChanges && !Permissions.canManageUsers(currentUser)) {
            const changeLog: string[] = [];

            fields.forEach(field => {
                if (updatedRequest[field] !== editingRequest[field]) {
                    const label = field === 'title' ? 'العنوان' :
                        field === 'location' ? 'المكان' :
                            field === 'description' ? 'الوصف' :
                                field === 'status' ? 'الحالة' : 'الأولوية';

                    const oldVal = field === 'status' ? t(editingRequest[field]) : editingRequest[field];
                    const newVal = field === 'status' ? t(updatedRequest[field]) : updatedRequest[field];

                    changeLog.push(`- ${label}: ${newVal} ⬅️ ${oldVal}`);
                }
            });

            if (changeLog.length > 0) {
                const admin = users.find(u => u.role === UserRole.ADMIN);
                if (admin && admin.phone) {
                    const message = language === 'ar'
                        ? `*🔧 تحديث طلب صيانة*\n\n` +
                        `👤 *قام بالتعديل:* ${currentUser?.name}\n` +
                        `📌 *الطلب:* ${updatedRequest.title}\n` +
                        `📍 *المكان:* ${updatedRequest.location}\n\n` +
                        `📋 *التغييرات:*\n${changeLog.join('\n')}\n\n` +
                        `📝 *السبب:* ${editReason || 'لا يوجد'}\n` +
                        `⏰ *التوقيت:* ${new Date().toLocaleString('ar-MA')}`
                        : `*🔧 Maintenance Update*\n\n` +
                        `👤 *Modified by:* ${currentUser?.name}\n` +
                        `📌 *Request:* ${updatedRequest.title}\n` +
                        `📍 *Location:* ${updatedRequest.location}\n\n` +
                        `📋 *Changes:*\n${changeLog.join('\n')}\n\n` +
                        `📝 *Reason:* ${editReason || 'None'}\n` +
                        `⏰ *Time:* ${new Date().toLocaleString('fr-FR')}`;

                    const phone = admin.phone.replace(/\D/g, '');
                    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            }
        }

        updateMaintenanceRequest(updatedRequest);
        setEditingRequest(null);
        setTempEditData(null);
    };

    // Quick status change wrapper using standard save logic
    const handleStatusChange = (req: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => {
        // We set up specific edit mode just for status, to leverage the same tracking logic
        setEditingRequest(req);
        setTempEditData({ ...req, status: newStatus });
        // Auto-save immediately if admin, or if other user we might want to prompt for reason?
        // For smoother UX, let's just do it directly if admin, or prompt if not.
        // User asked for "Same principle", which implies prompting for reason.

        if (!Permissions.canManageUsers(currentUser)) {
            // If not admin, we need the reason prompt. So we open the modal with the new status pre-set.
            setEditingRequest(req);
            setTempEditData({ ...req, status: newStatus });
            // No, wait, if I open the modal it's the full edit modal. 
            // Let's force the modal open.
            setEditReason('');
            return;
        } else {
            // Admin can fast-update
            const updated = { ...req, status: newStatus };
            updateMaintenanceRequest(updated);
        }
    };

    // Instead of quick status select for non-admins, they should use the edit button to Ensure tracking.
    // So if !canManageUsers, we disable the quick select or make it open the modal.

    const handleValuesChange = (field: keyof MaintenanceRequest, value: any) => {
        setTempEditData(prev => ({ ...prev!, [field]: value }));
    };

    const handleSendNotification = () => {
        if (!lastCreatedRequest) return;

        const recipient = users.find(u => u.id === selectedRecipientId);
        if (!recipient || !recipient.phone) {
            alert('المرجو اختيار مستلم برقم هاتف صحيح');
            return;
        }

        const priorityText = lastCreatedRequest.priority === 'high' ? '🔴 عاجل' :
            lastCreatedRequest.priority === 'medium' ? '🟠 متوسط' : '🟢 عادي';

        // Short reference from ID (last 4 chars)
        const refId = lastCreatedRequest.id.slice(-4).toUpperCase();

        const message = `🔧 *طلب صيانة جديد*

▫️ المرجع: #${refId}
▫️ ${lastCreatedRequest.title}
▫️ المكان: ${lastCreatedRequest.location}${notificationNotes ? `\n▫️ ملاحظة: ${notificationNotes}` : ''}

⚡ ${priorityText}

👤 ${lastCreatedRequest.reporterName}
📅 ${new Date(lastCreatedRequest.dateReported).toLocaleDateString('ar-MA')}

_منصة مرافقة_`;

        const phone = recipient.phone.replace(/\D/g, '');

        if (notificationChannel === 'whatsapp') {
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            // SMS protocol
            const smsUrl = `sms:${phone}${window.navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
            window.location.href = smsUrl;
        }

        setShowNotifyModal(false);
        setNotificationNotes('');
        setLastCreatedRequest(null);
    };

    const handleCloseNotifyModal = () => {
        setShowNotifyModal(false);
        setNotificationNotes('');
        setLastCreatedRequest(null);
    };

    // Get bursars for notification recipient list
    const bursars = users.filter(u => u.role === UserRole.BURSAR);

    const handleSendReminder = (request: MaintenanceRequest) => {
        // Find first bursar with phone
        const bursar = bursars.find(b => b.phone);
        if (!bursar || !bursar.phone) {
            alert('لا يوجد مقتصد برقم هاتف صحيح');
            return;
        }

        // Short reference from ID (last 4 chars)
        const refId = request.id.slice(-4).toUpperCase();
        const daysAgo = Math.floor((Date.now() - new Date(request.dateReported).getTime()) / (1000 * 60 * 60 * 24));

        const message = `⏰ *تذكير: طلب صيانة معلق*

▫️ المرجع: #${refId}
▫️ ${request.title}
▫️ المكان: ${request.location}

⏳ منذ ${daysAgo > 0 ? daysAgo + ' يوم' : 'اليوم'}

المرجو المتابعة ✅

_منصة مرافقة_`;

        const phone = bursar.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const getTypeIcon = (type: MaintenanceType) => {
        switch (type) {
            case 'plumbing': return <span className="text-blue-500 bg-blue-50 p-2 rounded-lg"><Wrench className="w-5 h-5" /></span>;
            case 'electricity': return <span className="text-yellow-500 bg-yellow-50 p-2 rounded-lg"><AlertTriangle className="w-5 h-5" /></span>;
            case 'cleaning': return <span className="text-emerald-500 bg-emerald-50 p-2 rounded-lg"><CheckCircle className="w-5 h-5" /></span>;
            case 'equipment': return <span className="text-purple-500 bg-purple-50 p-2 rounded-lg"><Hammer className="w-5 h-5" /></span>;
            default: return <span className="text-gray-500 bg-gray-50 p-2 rounded-lg"><Clock className="w-5 h-5" /></span>;
        }
    };

    const getPriorityColor = (priority: PriorityLevel) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    const renderTooltip = (originalValue: any, modifier: string | undefined, reason: string | undefined) => (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-20">
            <div className="font-bold border-b border-gray-600 mb-1 pb-1">{language === 'ar' ? 'الأصل:' : 'Original:'}</div>
            {originalValue}
            <div className="mt-1 text-gray-400 italic font-mono text-[10px]">
                {modifier} - {reason}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Wrench className="w-7 h-7 text-amber-600" />
                        {t('maintenance_title')}
                    </h2>
                    <p className="text-gray-500 mt-1">{t('maintenance_desc')}</p>
                </div>

                <button
                    onClick={handleOpenModal}
                    className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-amber-700 flex items-center gap-2 shadow-lg hover:shadow-amber-200 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('add_request')}</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold mb-1">{t('pending_requests')}</p>
                        <h3 className="text-3xl font-bold text-red-500">{maintenanceRequests.filter(r => r.status === 'pending').length}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-500"><Clock className="w-8 h-8" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold mb-1">{t('in_progress')}</p>
                        <h3 className="text-3xl font-bold text-amber-500">{maintenanceRequests.filter(r => r.status === 'in_progress').length}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-500"><Wrench className="w-8 h-8" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold mb-1">{t('completed')}</p>
                        <h3 className="text-3xl font-bold text-emerald-500">{maintenanceRequests.filter(r => r.status === 'completed').length}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><CheckCircle className="w-8 h-8" /></div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto">
                {(['all', 'pending', 'in_progress', 'completed'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border whitespace-nowrap ${filterStatus === status
                            ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {status === 'all' ? 'الكل' : t(status)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRequests.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                        <Wrench className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">لا توجد طلبات صيانة حالياً.</p>
                    </div>
                ) : (
                    filteredRequests.map(req => (
                        <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col group relative">
                            {canUpdateStatus && (
                                <button
                                    onClick={() => handleEditClick(req)}
                                    className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full text-gray-500 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="تعديل"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}

                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        {getTypeIcon(req.type)}
                                        <div>
                                            <div className="relative group">
                                                <h3 className={`font-bold line-clamp-1 ${req.originalValues?.title ? 'text-orange-600' : 'text-gray-800'}`}>
                                                    {req.title}
                                                </h3>
                                                {req.originalValues?.title && renderTooltip(req.originalValues.title, req.modifiedBy, req.modificationReason)}
                                            </div>
                                            <div className="relative group">
                                                <p className={`text-xs ${req.originalValues?.location ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                                                    {req.location}
                                                </p>
                                                {req.originalValues?.location && renderTooltip(req.originalValues.location, req.modifiedBy, req.modificationReason)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getPriorityColor(req.priority)}`}>
                                        {t(req.priority)}
                                    </span>
                                </div>

                                <div className="relative group">
                                    <p className={`text-sm mb-4 leading-relaxed line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100 ${req.originalValues?.description ? 'text-orange-700 border-orange-200' : 'text-gray-600'}`}>
                                        {req.description}
                                    </p>
                                    {req.originalValues?.description && renderTooltip(req.originalValues.description, req.modifiedBy, req.modificationReason)}
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
                                    <span>{req.dateReported}</span>
                                    <span>بواسطة: {req.reporterName}</span>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center">
                                {canUpdateStatus ? (
                                    <div className="relative group">
                                        <select
                                            value={req.status}
                                            // Ensure we check strictAdmin permissions for quick select, otherwise trigger modal
                                            onChange={(e) => {
                                                const newStatus = e.target.value as any;
                                                if (Permissions.canManageUsers(currentUser)) {
                                                    // Admin -> Quick Update
                                                    handleStatusChange(req, newStatus);
                                                } else {
                                                    // Non-Admin -> Open Edit Modal to force reason
                                                    setEditingRequest(req);
                                                    setTempEditData({ ...req, status: newStatus });
                                                    setEditReason('');
                                                }
                                            }}
                                            className={`appearance-none pl-8 pr-8 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 cursor-pointer
                                         ${req.status === 'pending' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-200' : ''}
                                         ${req.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200' : ''}
                                         ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200' : ''}`}
                                        >
                                            <option value="pending">{t('pending_requests')}</option>
                                            <option value="in_progress">{t('in_progress')}</option>
                                            <option value="completed">{t('completed')}</option>
                                        </select>
                                        {req.originalValues?.status && renderTooltip(t(req.originalValues.status as string), req.modifiedBy, req.modificationReason)}

                                        {/* Icon overlay */}
                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-red-600" />}
                                            {req.status === 'in_progress' && <Wrench className="w-3.5 h-3.5 text-amber-600" />}
                                            {req.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                        </div>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown className="w-3 h-3" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${req.status === 'pending' ? 'text-red-600 bg-red-100' :
                                            req.status === 'in_progress' ? 'text-amber-600 bg-amber-100' :
                                                'text-emerald-600 bg-emerald-100'
                                            }`}>
                                            {req.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {req.status === 'in_progress' && <Wrench className="w-3 h-3" />}
                                            {req.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                            {t(req.status === 'pending' ? 'pending_requests' : req.status)}
                                        </div>
                                        {req.originalValues?.status && renderTooltip(t(req.originalValues.status as string), req.modifiedBy, req.modificationReason)}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {req.status === 'pending' && bursars.length > 0 && (
                                        <button
                                            onClick={() => handleSendReminder(req)}
                                            className="p-1.5 bg-white border hover:bg-amber-50 text-amber-500 rounded-lg shadow-sm transition-colors"
                                            title="تذكير المقتصد"
                                        >
                                            <Bell className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => deleteMaintenanceRequest(req.id)}
                                            className="p-1.5 bg-white border hover:bg-red-50 text-red-500 rounded-lg shadow-sm transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Request Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-amber-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                                <Plus className="w-6 h-6 text-amber-600" />
                                {t('add_request')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-amber-400 hover:text-amber-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الطلب</label>
                                    <input
                                        type="text"
                                        value={newRequest.title || ''}
                                        onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="مثال: إصلاح إنارة الممر"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">نوع الصيانة</label>
                                        <select
                                            value={newRequest.type}
                                            onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as any })}
                                            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                        >
                                            <option value="plumbing">{t('plumbing')}</option>
                                            <option value="electricity">{t('electricity')}</option>
                                            <option value="cleaning">{t('cleaning')}</option>
                                            <option value="equipment">{t('equipment')}</option>
                                            <option value="other">{t('other')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('priority')}</label>
                                        <select
                                            value={newRequest.priority}
                                            onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value as any })}
                                            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                        >
                                            <option value="low">{t('low')}</option>
                                            <option value="medium">{t('medium')}</option>
                                            <option value="high">{t('high')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ الطلب</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={newRequest.dateReported}
                                            onChange={(e) => setNewRequest({ ...newRequest, dateReported: e.target.value })}
                                            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('location')}</label>
                                    <input
                                        type="text"
                                        value={newRequest.location || ''}
                                        onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="تحديد المكان بدقة"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">الوصف والتفاصيل</label>
                                    <textarea
                                        value={newRequest.description || ''}
                                        onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none resize-none h-24"
                                        placeholder="شرح المشكلة..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                                {t('cancel')}
                            </button>
                            <button onClick={handleSaveNew} className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 shadow-md transition-colors">
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Update Modal */}
            {editingRequest && tempEditData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-blue-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                <Edit2 className="w-6 h-6 text-blue-600" />
                                {language === 'ar' ? 'تعديل الطلب' : 'Modifier la demande'}
                            </h3>
                            <button onClick={() => setEditingRequest(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                                    <input
                                        type="text"
                                        value={tempEditData.title}
                                        onChange={(e) => handleValuesChange('title', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">الحالة</label>
                                        <select
                                            value={tempEditData.status}
                                            onChange={(e) => handleValuesChange('status', e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="pending">{t('pending_requests')}</option>
                                            <option value="in_progress">{t('in_progress')}</option>
                                            <option value="completed">{t('completed')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">الأولوية</label>
                                        <select
                                            value={tempEditData.priority}
                                            onChange={(e) => handleValuesChange('priority', e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="low">{t('low')}</option>
                                            <option value="medium">{t('medium')}</option>
                                            <option value="high">{t('high')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('location')}</label>
                                    <input
                                        type="text"
                                        value={tempEditData.location}
                                        onChange={(e) => handleValuesChange('location', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
                                    <textarea
                                        value={tempEditData.description}
                                        onChange={(e) => handleValuesChange('description', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                    />
                                </div>

                                {/* Reason for Edit (Visible to Non-Admins) */}
                                {!Permissions.canManageUsers(currentUser) && (
                                    <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <label className="block text-sm font-bold text-orange-800 mb-2">
                                            {language === 'ar' ? 'سبب التعديل (إلزامي)' : 'Raison de la modification (Requis)'}
                                        </label>
                                        <textarea
                                            value={editReason}
                                            onChange={(e) => setEditReason(e.target.value)}
                                            placeholder={language === 'ar' ? 'يرجى ذكر سبب التغيير...' : 'Veuillez indiquer la raison...'}
                                            className="w-full border border-orange-200 rounded-xl p-3 h-20 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none resize-none text-sm"
                                        />
                                        <p className="text-xs text-orange-600 mt-2">
                                            {language === 'ar'
                                                ? '⚠️ سيتم إرسال إشعار تلقائي للمدير بالتحديثات.'
                                                : '⚠️ Une notification sera envoyée automatiquement au directeur.'}
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setEditingRequest(null)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                                {t('cancel')}
                            </button>
                            <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-colors">
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notify Bursar Modal (For New Requests) */}
            {showNotifyModal && lastCreatedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b flex-shrink-0 bg-emerald-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                                <Send className="w-6 h-6 text-emerald-600" />
                                إرسال إشعار للمقتصد
                            </h3>
                            <button onClick={handleCloseNotifyModal} className="text-emerald-400 hover:text-emerald-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-6">
                                {/* Request Summary */}
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <h4 className="font-bold text-amber-900 mb-2">ملخص الطلب:</h4>
                                    <p className="text-amber-800 text-sm">📋 {lastCreatedRequest.title}</p>
                                    <p className="text-amber-700 text-xs mt-1">📍 {lastCreatedRequest.location}</p>
                                </div>

                                {/* Recipient Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        اختيار المقتصد
                                    </label>
                                    <select
                                        value={selectedRecipientId}
                                        onChange={(e) => setSelectedRecipientId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        {bursars.length > 0 ? (
                                            bursars.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} {u.phone ? `(${u.phone})` : '(بدون هاتف)'}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">لا يوجد مقتصد مسجل</option>
                                        )}
                                    </select>
                                    {bursars.length === 0 && (
                                        <p className="text-xs text-red-500 mt-2">يجب إضافة مقتصد في إدارة المستخدمين أولاً</p>
                                    )}
                                </div>

                                {/* Notification Channel */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        وسيلة الإرسال
                                    </label>
                                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setNotificationChannel('whatsapp')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${notificationChannel === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNotificationChannel('sms')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${notificationChannel === 'sms' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Phone className="w-4 h-4" />
                                            SMS
                                        </button>
                                    </div>
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية</label>
                                    <textarea
                                        value={notificationNotes}
                                        onChange={(e) => setNotificationNotes(e.target.value)}
                                        placeholder="أي تفاصيل إضافية للمقتصد..."
                                        className="w-full border border-gray-300 rounded-xl p-3 h-20 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={handleCloseNotifyModal}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                تخطي
                            </button>
                            <button
                                type="button"
                                onClick={handleSendNotification}
                                disabled={!selectedRecipientId || bursars.length === 0}
                                className={`flex-1 ${notificationChannel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {notificationChannel === 'whatsapp' ? (
                                    <MessageCircle className="w-5 h-5" />
                                ) : (
                                    <Phone className="w-5 h-5" />
                                )}
                                إرسال للمقتصد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Maintenance;