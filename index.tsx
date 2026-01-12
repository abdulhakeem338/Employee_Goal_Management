
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// إعلان مكتبة XLSX لـ TypeScript كونها مستوردة كـ Script Tag
declare var XLSX: any;

// --- Types & Constants ---
interface Task {
    id: string | number;
    name: string;
    estimatedDays: number;
    expectedMonth: string;
    actualOutcome?: string;
    finalRating?: number;
    isApproved?: boolean;
}

interface Goal {
    id: string | number;
    title: string;
    year: number;
    tasks: Task[];
    finalRating?: number;
    actualOutcome?: string;
    isApproved?: boolean;
}

interface Employee {
    id: string | number;
    name: string;
    position: string;
    goals: Goal[];
    isFinalApproved?: boolean;
}

const STORAGE_KEY = 'hr_performance_system_v3';
const ADMIN_CREDENTIALS = { username: 'admin', password: '123' };
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// --- Helper Functions ---
const saveToStorage = (data: Employee[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const loadFromStorage = (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

// --- Components ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'secondary' | 'warning' }> = ({ children, variant = 'primary', className = '', ...props }) => {
    const base = "px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm";
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-lg',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 shadow-lg',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200 shadow-lg',
        secondary: 'bg-slate-700 text-white hover:bg-slate-800',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200 shadow-lg',
        ghost: 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'
    };
    return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-right" dir="rtl">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

function App() {
    const [user, setUser] = useState<any>(null); 
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState<string | number | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewPhase, setViewPhase] = useState<'planning' | 'execution' | 'results'>('planning');
    
    const [modals, setModals] = useState({
        addEmp: false,
        addGoal: false,
        addTask: false,
        editTask: false,
        evaluate: false
    });
    const [activeGoalId, setActiveGoalId] = useState<string | number | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | number | null>(null);

    useEffect(() => {
        setEmployees(loadFromStorage());
    }, []);

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            setUser({ id: 'admin', name: 'المدير العام', role: 'admin' });
        } else {
            const emp = employees.find(e => e.name === username);
            if (emp) {
                setUser({ ...emp, role: 'employee' });
                setSelectedEmpId(emp.id);
            } else {
                alert('خطأ في بيانات الدخول');
            }
        }
    };

    const currentEmp = employees.find(e => e.id === (user?.role === 'admin' ? selectedEmpId : user?.id));

    const calculateGoalRating = (tasks: Task[]): number => {
        const tasksWithRating = tasks.filter(t => t.finalRating !== undefined);
        if (tasksWithRating.length === 0) return 0;
        const sum = tasksWithRating.reduce((acc, t) => acc + (t.finalRating || 0), 0);
        return Math.round(sum / tasksWithRating.length);
    };

    const handleExportExcel = () => {
        const flatData: any[] = [];
        employees.forEach(emp => {
            emp.goals.forEach(goal => {
                if (goal.tasks.length === 0) {
                    flatData.push({
                        "اسم الموظف": emp.name,
                        "المسمى الوظيفي": emp.position,
                        "الهدف": goal.title,
                        "السنة": goal.year,
                        "المهمة": "-",
                        "التقييم": goal.finalRating || 0,
                        "الحالة": goal.isApproved ? "معتمد" : "قيد المراجعة"
                    });
                } else {
                    goal.tasks.forEach(task => {
                        flatData.push({
                            "اسم الموظف": emp.name,
                            "المسمى الوظيفي": emp.position,
                            "الهدف": goal.title,
                            "السنة": goal.year,
                            "المهمة": task.name,
                            "التقييم": task.finalRating || 0,
                            "الحالة": task.isApproved ? "معتمد" : "قيد المراجعة"
                        });
                    });
                }
            });
        });
        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "بيانات الأداء");
        XLSX.writeFile(wb, `Report_${selectedYear}.xlsx`);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt: any) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const newEmployeesMap: { [key: string]: Employee } = {};

            data.forEach((row: any) => {
                const empName = row["اسم الموظف"];
                const empPos = row["المسمى الوظيفي"] || "موظف";
                const goalTitle = row["الهدف"];
                const goalYear = parseInt(row["السنة"]) || selectedYear;
                const taskName = row["المهمة"];

                if (!empName) return;

                if (!newEmployeesMap[empName]) {
                    newEmployeesMap[empName] = {
                        id: `emp_${Date.now()}_${Math.random()}`,
                        name: empName,
                        position: empPos,
                        goals: []
                    };
                }

                if (goalTitle && goalTitle !== "-") {
                    let goal = newEmployeesMap[empName].goals.find(g => g.title === goalTitle && g.year === goalYear);
                    if (!goal) {
                        goal = {
                            id: `goal_${Date.now()}_${Math.random()}`,
                            title: goalTitle,
                            year: goalYear,
                            tasks: [],
                            finalRating: typeof row["التقييم"] === 'number' ? row["التقييم"] : undefined,
                            isApproved: row["الحالة"] === "معتمد"
                        };
                        newEmployeesMap[empName].goals.push(goal);
                    }

                    if (taskName && taskName !== "-") {
                        goal.tasks.push({
                            id: `task_${Date.now()}_${Math.random()}`,
                            name: taskName,
                            estimatedDays: 0,
                            expectedMonth: "-",
                            finalRating: typeof row["التقييم"] === 'number' ? row["التقييم"] : undefined,
                            isApproved: row["الحالة"] === "معتمد"
                        });
                    }
                }
            });

            const finalEmployees = Object.values(newEmployeesMap);
            setEmployees(finalEmployees);
            saveToStorage(finalEmployees);
            alert('تم استيراد البيانات بنجاح');
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const addGoal = (e: React.FormEvent<HTMLFormElement>) => {
        if (user.role !== 'admin') return;
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const newGoal: Goal = { id: Date.now(), title, year: selectedYear, tasks: [] };
        const updated = employees.map(emp => emp.id === currentEmp?.id ? { ...emp, goals: [...emp.goals, newGoal] } : emp);
        setEmployees(updated);
        saveToStorage(updated);
        setModals({ ...modals, addGoal: false });
    };

    const handleTaskAction = (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
        if (user.role !== 'admin') return;
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const days = parseInt(formData.get('days') as string) || 0;
        const month = formData.get('month') as string;

        const updated = employees.map(emp => {
            if (emp.id !== currentEmp?.id) return emp;
            return {
                ...emp,
                goals: emp.goals.map(g => {
                    if (g.id !== activeGoalId) return g;
                    if (isEdit) {
                        return { ...g, tasks: g.tasks.map(t => t.id === activeTaskId ? { ...t, name, estimatedDays: days, expectedMonth: month } : t) };
                    } else {
                        const newTask: Task = { id: Date.now(), name, estimatedDays: days, expectedMonth: month };
                        return { ...g, tasks: [...g.tasks, newTask] };
                    }
                })
            };
        });
        setEmployees(updated);
        saveToStorage(updated);
        setModals({ ...modals, addTask: false, editTask: false });
    };

    const handleEvaluate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const outcome = formData.get('outcome') as string;
        const ratingRaw = formData.get('rating');
        const rating = ratingRaw !== null ? parseInt(ratingRaw as string) : undefined;
        const isApproved = formData.get('approve_check') === 'on';

        const updated = employees.map(emp => {
            if (emp.id !== currentEmp?.id) return emp;
            return {
                ...emp,
                goals: emp.goals.map(g => {
                    if (g.id !== activeGoalId) return g;
                    let updatedTasks = g.tasks;
                    if (activeTaskId !== null) {
                        updatedTasks = g.tasks.map(t => t.id === activeTaskId ? { 
                            ...t, 
                            ...(user.role === 'admin' && rating !== undefined && { finalRating: rating }),
                            ...(user.role === 'admin' && { isApproved }),
                            actualOutcome: outcome 
                        } : t);
                    }
                    
                    const newGoalRating = activeTaskId !== null ? calculateGoalRating(updatedTasks) : (rating !== undefined ? rating : g.finalRating);
                    return { 
                        ...g, 
                        tasks: updatedTasks,
                        finalRating: newGoalRating,
                        actualOutcome: activeTaskId === null ? outcome : g.actualOutcome,
                        ...(user.role === 'admin' && activeTaskId === null && { isApproved })
                    };
                })
            };
        });
        setEmployees(updated);
        saveToStorage(updated);
        setModals({ ...modals, evaluate: false });
    };

    const handleApproveAll = () => {
        if (!confirm('هل تريد اعتماد كافة نتائج هذا الموظف بشكل نهائي؟')) return;
        const updated = employees.map(emp => {
            if (emp.id !== currentEmp?.id) return emp;
            return {
                ...emp,
                isFinalApproved: true,
                goals: emp.goals.map(g => ({
                    ...g,
                    isApproved: true,
                    tasks: g.tasks.map(t => ({ ...t, isApproved: true }))
                }))
            };
        });
        setEmployees(updated);
        saveToStorage(updated);
    };

    const deleteGoal = (goalId: string | number) => {
        if (user.role !== 'admin') return;
        if (!confirm('حذف الهدف؟')) return;
        const updated = employees.map(emp => emp.id === currentEmp?.id ? { ...emp, goals: emp.goals.filter(g => g.id !== goalId) } : emp);
        setEmployees(updated);
        saveToStorage(updated);
    };

    const activeTask = currentEmp?.goals.find(g => g.id === activeGoalId)?.tasks.find(t => t.id === activeTaskId);
    const activeGoal = currentEmp?.goals.find(g => g.id === activeGoalId);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 max-w-md w-full border border-slate-100 text-right">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-indigo-200">
                            <i className="fas fa-lock"></i>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800">بوابة الأداء الذكية</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <input name="username" type="text" className="w-full p-4 rounded-2xl border bg-slate-50 outline-none font-bold" placeholder="اسم المستخدم" required />
                        <input name="password" type="password" className="w-full p-4 rounded-2xl border bg-slate-50 outline-none font-bold" placeholder="كلمة المرور" required />
                        <Button type="submit" className="w-full py-4 text-lg">دخول</Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50" dir="rtl">
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <span className="text-xl font-black text-slate-800">منصة الإنجاز</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {user.role === 'admin' && (
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={handleExportExcel} className="!text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                                    <i className="fas fa-file-excel"></i> تصدير Excel
                                </Button>
                                <label className="cursor-pointer">
                                    <span className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2">
                                        <i className="fas fa-file-import"></i> استيراد Excel
                                    </span>
                                    <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls" />
                                </label>
                            </div>
                        )}
                        <span className="text-slate-600 font-bold text-sm">مرحباً، {user.name}</span>
                        <Button variant="danger" className="!px-3 !py-2" onClick={() => {setUser(null); setSelectedEmpId(null);}}><i className="fas fa-sign-out-alt"></i></Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 space-y-8">
                {user.role === 'admin' && !selectedEmpId ? (
                    <section className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-800">قائمة الموظفين</h2>
                            <Button variant="success" onClick={() => setModals({ ...modals, addEmp: true })}><i className="fas fa-plus"></i> إضافة موظف</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {employees.map(emp => (
                                <div key={emp.id} onClick={() => setSelectedEmpId(emp.id)} className="bg-white p-6 rounded-3xl border hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group">
                                    {emp.isFinalApproved && <div className="absolute top-0 left-0 bg-emerald-500 text-white px-3 py-1 text-xs font-black rounded-br-xl">معتمد</div>}
                                    <h3 className="text-xl font-black text-slate-800">{emp.name}</h3>
                                    <p className="text-slate-400 font-bold text-sm">{emp.position}</p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg font-bold">{emp.goals.length} أهداف</span>
                                        <i className="fas fa-chevron-left text-slate-300 group-hover:text-indigo-600 transition-colors"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="animate-in slide-in-from-left duration-500 text-right">
                        <div className="bg-white p-8 rounded-[2.5rem] border mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                {user.role === 'admin' && <button onClick={() => setSelectedEmpId(null)} className="p-3 bg-slate-50 rounded-2xl"><i className="fas fa-arrow-right"></i></button>}
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800">{currentEmp?.name}</h2>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-indigo-600 font-black text-sm">{currentEmp?.position}</span>
                                        {currentEmp?.isFinalApproved && <span className="bg-emerald-100 text-emerald-700 px-3 py-0.5 rounded-full text-xs font-black">ملف معتمد نهائياً</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                {(['planning', 'execution', 'results'] as const).map(p => (
                                    <button key={p} onClick={() => setViewPhase(p)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewPhase === p ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                        {p === 'planning' ? 'التخطيط' : p === 'execution' ? 'التنفيذ' : 'النتائج'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end mb-4 gap-2">
                            {user.role === 'admin' && viewPhase === 'results' && !currentEmp?.isFinalApproved && (
                                <Button variant="success" onClick={handleApproveAll}><i className="fas fa-check-double"></i> اعتماد كافة النتائج</Button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {currentEmp?.goals.map(goal => (
                                <div key={goal.id} className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
                                    <div className="p-6 bg-slate-50/50 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">{goal.finalRating || 0}%</div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">{goal.title}</h3>
                                                {goal.isApproved && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase">هدف معتمد</span>}
                                            </div>
                                        </div>
                                        {user.role === 'admin' && !currentEmp.isFinalApproved && (
                                            <div className="flex gap-2">
                                                <Button variant="ghost" onClick={() => {setActiveGoalId(goal.id); setModals({...modals, addTask: true});}} title="إضافة مهمة"><i className="fas fa-plus"></i></Button>
                                                <Button variant="danger" className="!p-2" onClick={() => deleteGoal(goal.id)} title="حذف الهدف"><i className="fas fa-trash-alt"></i></Button>
                                            </div>
                                        )}
                                        {user.role === 'admin' && viewPhase === 'results' && !goal.isApproved && !currentEmp?.isFinalApproved && (
                                            <Button variant="success" className="text-xs" onClick={() => {setActiveGoalId(goal.id); setActiveTaskId(null); setModals({...modals, evaluate: true});}}><i className="fas fa-star"></i> تقييم الهدف</Button>
                                        )}
                                    </div>
                                    <div className="p-6 overflow-x-auto">
                                        <table className="w-full text-right">
                                            <thead>
                                                <tr className="text-slate-400 text-xs border-b">
                                                    <th className="pb-4 px-4">المهمة التنفيذية</th>
                                                    <th className="pb-4 px-4">الزمن</th>
                                                    <th className="pb-4 px-4">الشهر</th>
                                                    <th className="pb-4 px-4">الحالة</th>
                                                    <th className="pb-4 px-4">التقييم</th>
                                                    <th className="pb-4 px-4">الإجراء</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {goal.tasks.map(task => (
                                                    <tr key={task.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-4 font-bold text-slate-700">{task.name}</td>
                                                        <td className="py-4 px-4 text-slate-500">{task.estimatedDays} أيام</td>
                                                        <td className="py-4 px-4 font-bold">{task.expectedMonth}</td>
                                                        <td className="py-4 px-4">
                                                            {task.isApproved ? (
                                                                <span className="text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-1 rounded">معتمد</span>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs italic">قيد المراجعة</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`font-black ${task.finalRating ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                                {task.finalRating !== undefined ? `${task.finalRating}%` : '---'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex gap-2">
                                                                {user.role === 'admin' && (viewPhase === 'execution' || viewPhase === 'planning') && (
                                                                    <button onClick={() => {setActiveGoalId(goal.id); setActiveTaskId(task.id); setModals({...modals, editTask: true});}} className="text-indigo-600 hover:scale-110" title="تحرير المهمة"><i className="fas fa-edit"></i></button>
                                                                )}
                                                                {viewPhase === 'results' && !currentEmp.isFinalApproved && (
                                                                    <button onClick={() => {setActiveGoalId(goal.id); setActiveTaskId(task.id); setModals({...modals, evaluate: true});}} className={`${user.role === 'admin' ? 'text-emerald-600' : 'text-indigo-600'} font-bold border px-3 py-1 rounded-lg text-xs`}>
                                                                        {user.role === 'admin' ? 'اعتماد/تقييم' : 'تحديث التنفيذ'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {goal.tasks.length === 0 && <div className="text-center py-6 text-slate-300">لا توجد مهام حالياً</div>}
                                    </div>
                                </div>
                            ))}
                            {user.role === 'admin' && viewPhase === 'planning' && (
                                <button onClick={() => setModals({...modals, addGoal: true})} className="w-full py-8 border-2 border-dashed rounded-[2rem] text-slate-400 font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all">+ إضافة هدف استراتيجي</button>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* Modals */}
            <Modal isOpen={modals.addTask || modals.editTask} onClose={() => setModals({...modals, addTask: false, editTask: false})} title={modals.editTask ? "تحرير المهمة (مدير)" : "مهمة جديدة (مدير)"}>
                <form onSubmit={(e) => handleTaskAction(e, modals.editTask)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">اسم المهمة</label>
                        <input name="name" defaultValue={activeTask?.name} placeholder="وصف المهمة التنفيذية" className="w-full p-4 border rounded-2xl font-bold" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">الزمن (أيام)</label>
                            <input name="days" type="number" defaultValue={activeTask?.estimatedDays} placeholder="الأيام" className="w-full p-4 border rounded-2xl font-bold" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">الشهر المتوقع</label>
                            <select name="month" defaultValue={activeTask?.expectedMonth || MONTHS[0]} className="w-full p-4 border rounded-2xl font-bold">
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <Button type="submit" className="w-full py-4">حفظ التغييرات</Button>
                </form>
            </Modal>

            <Modal isOpen={modals.evaluate} onClose={() => setModals({...modals, evaluate: false})} title={user.role === 'admin' ? "اعتماد وتقييم النتائج (مدير)" : "تحديث تفاصيل التنفيذ (موظف)"}>
                <form onSubmit={handleEvaluate} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block text-right">تفاصيل التنفيذ وما تم إنجازه</label>
                        <textarea 
                            name="outcome" 
                            defaultValue={activeTaskId ? activeTask?.actualOutcome : activeGoal?.actualOutcome} 
                            placeholder="اكتب هنا تفاصيل ما تم تنفيذه..." 
                            className="w-full p-4 border rounded-2xl min-h-[120px] font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                            required 
                        />
                    </div>
                    
                    {user.role === 'admin' && (
                        <div className="bg-indigo-50 p-6 rounded-[2rem] space-y-4 border border-indigo-100">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-indigo-800 uppercase tracking-widest block text-right">نسبة الإنجاز النهائية (%)</label>
                                <input 
                                    name="rating" 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    defaultValue={activeTaskId ? activeTask?.finalRating : activeGoal?.finalRating}
                                    placeholder="0 - 100" 
                                    className="w-full p-4 border rounded-2xl bg-white text-center text-2xl font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-200" 
                                    required 
                                />
                            </div>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border">
                                <input 
                                    id="approve_check" 
                                    name="approve_check" 
                                    type="checkbox" 
                                    defaultChecked={activeTaskId ? activeTask?.isApproved : activeGoal?.isApproved}
                                    className="w-5 h-5 accent-emerald-500" 
                                />
                                <label htmlFor="approve_check" className="text-sm font-black text-slate-700 cursor-pointer select-none">اعتماد التنفيذ رسمياً</label>
                            </div>
                        </div>
                    )}
                    
                    <Button type="submit" className="w-full py-4 text-lg">
                        {user.role === 'admin' ? 'حفظ التقييم والاعتماد' : 'حفظ تفاصيل التنفيذ'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={modals.addGoal} onClose={() => setModals({...modals, addGoal: false})} title="إضافة هدف استراتيجي (مدير)">
                <form onSubmit={addGoal} className="space-y-4">
                    <label className="text-xs font-bold text-slate-400">وصف الهدف</label>
                    <textarea name="title" placeholder="وصف الهدف الاستراتيجي..." className="w-full p-4 border rounded-2xl min-h-[100px] font-bold" required />
                    <Button type="submit" className="w-full py-4">إضافة الهدف للموظف</Button>
                </form>
            </Modal>

            <Modal isOpen={modals.addEmp} onClose={() => setModals({...modals, addEmp: false})} title="إضافة موظف جديد">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const newE: Employee = { id: Date.now(), name: fd.get('name') as string, position: fd.get('pos') as string, goals: [] };
                    const updated = [...employees, newE];
                    setEmployees(updated); saveToStorage(updated);
                    setModals({...modals, addEmp: false});
                }} className="space-y-4">
                    <input name="name" placeholder="اسم الموظف" className="w-full p-4 border rounded-2xl font-bold" required />
                    <input name="pos" placeholder="المسمى الوظيفي" className="w-full p-4 border rounded-2xl font-bold" required />
                    <Button type="submit" className="w-full py-4">حفظ بيانات الموظف</Button>
                </form>
            </Modal>
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
