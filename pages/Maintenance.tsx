import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { MaintenanceRequest, MaintenanceType, PriorityLevel, UserRole } from '../types';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle, Hammer, X, Filter, Trash2, Edit2, ChevronDown, Calendar } from 'lucide-react';

const Maintenance: React.FC = () => {
    const { maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, currentUser } = useData();
    const { t } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

    const [newRequest, setNewRequest] = useState<Partial<MaintenanceRequest>>({
        type: 'plumbing',
        priority: 'medium',
        status: 'pending',
        dateReported: new Date().toISOString().split('T')[0]
    });

    // Permission Logic
    // 1. Who can update status? (Admin, Bursar, Supervisor for dorms, Catering Manager for kitchen)
    const canUpdateStatus = [
        UserRole.ADMIN,
        UserRole.BURSAR,
        UserRole.SUPERVISOR,
        UserRole.CATERING_MANAGER
    ].includes(currentUser?.role || UserRole.PARENT);

    // 2. Who can delete requests? (Only Admin and Bursar for data integrity)
    const canDelete = currentUser && [UserRole.ADMIN, UserRole.BURSAR].includes(currentUser.role);

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

    const handleSave = () => {
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
    };

    const handleStatusChange = (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => {
        updateMaintenanceRequest({ ...request, status: newStatus });
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
                        <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        {getTypeIcon(req.type)}
                                        <div>
                                            <h3 className="font-bold text-gray-800 line-clamp-1">{req.title}</h3>
                                            <p className="text-xs text-gray-500">{req.location}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getPriorityColor(req.priority)}`}>
                                        {t(req.priority)}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {req.description}
                                </p>

                                <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
                                    <span>{req.dateReported}</span>
                                    <span>بواسطة: {req.reporterName}</span>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center">
                                {canUpdateStatus ? (
                                    <div className="relative">
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleStatusChange(req, e.target.value as any)}
                                            className={`
                                         appearance-none pl-8 pr-8 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 cursor-pointer
                                         ${req.status === 'pending' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-200' : ''}
                                         ${req.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200' : ''}
                                         ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200' : ''}
                                     `}
                                        >
                                            <option value="pending">{t('pending_requests')}</option>
                                            <option value="in_progress">{t('in_progress')}</option>
                                            <option value="completed">{t('completed')}</option>
                                        </select>
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
                                    <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${req.status === 'pending' ? 'text-red-600 bg-red-100' :
                                            req.status === 'in_progress' ? 'text-amber-600 bg-amber-100' :
                                                'text-emerald-600 bg-emerald-100'
                                        }`}>
                                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                                        {req.status === 'in_progress' && <Wrench className="w-3 h-3" />}
                                        {req.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                        {t(req.status === 'pending' ? 'pending_requests' : req.status)}
                                    </div>
                                )}

                                <div className="flex gap-2">
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

                                {/* Date Input */}
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
                            <button onClick={handleSave} className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 shadow-md transition-colors">
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Maintenance;