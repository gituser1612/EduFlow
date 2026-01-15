import React, { useEffect, useMemo, useState } from "react";
import {
    CreditCard,
    Loader2,
    PlusCircle,
    ReceiptIndianRupee,
    FileText,
} from "lucide-react";
import { supabase } from "../supabase";
import { Student } from "../types";

interface TeacherFeesProps {
    teacherId: string;
}

type PaymentRow = {
    id: string;
    student_id: string;
    amount: number;
    date: string;
    receipt_id: string | null;
    created_at: string;
};

const TeacherFees: React.FC<TeacherFeesProps> = ({ teacherId }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [receiptId, setReceiptId] = useState<string>("");
    const [date, setDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Fetch payments for all assigned students
    const fetchPayments = async (studentIds: string[]) => {
        if (studentIds.length === 0) {
            setPayments([]);
            return;
        }

        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .in("student_id", studentIds)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Fetch payments error:", error.message);
            return;
        }

        setPayments((data as PaymentRow[]) || []);
    };

    // ✅ Fetch teacher students + payments
    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("teacher_id", teacherId);

        if (error) {
            console.error("Fetch students error:", error.message);
            return;
        }

        const mapped = (data || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            parentName: s.parent_name,
            rollNo: s.roll_no,
            feesDue: s.fees_due ?? 0,
            teacherId: s.teacher_id,
            parentId: "",
        }));

        setStudents(mapped);

        // Default select first student
        if (mapped.length > 0 && !selectedStudentId) {
            setSelectedStudentId(mapped[0].id);
        }

        // ✅ Fetch payments for all assigned students
        await fetchPayments(mapped.map((s) => s.id));
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await fetchStudents();
            setIsLoading(false);
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherId]);

    // ✅ Realtime subscription
    useEffect(() => {
        const studentIds = students.map((s) => s.id);
        if (studentIds.length === 0) return;

        const channel = supabase
            .channel("teacher-fees-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "payments" },
                (payload) => {
                    const newRow = payload.new as any;
                    const oldRow = payload.old as any;

                    const targetStudentId = newRow?.student_id || oldRow?.student_id;

                    // only update if payment belongs to this teacher students
                    if (!studentIds.includes(targetStudentId)) return;

                    // refresh payments
                    fetchPayments(studentIds);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [students]);

    const studentMap = useMemo(() => {
        const map: Record<string, Student> = {};
        students.forEach((s) => (map[s.id] = s));
        return map;
    }, [students]);

    const submitPayment = async () => {
        if (!selectedStudentId) return alert("Please select a student");
        if (!amount || amount <= 0) return alert("Enter valid amount");

        setIsSubmitting(true);

        try {
            console.log("AMOUNT BEFORE INSERT:", amount, typeof amount);
            console.log("STUDENT ID:", selectedStudentId);
            console.log("DATE:", date);
            const { error } = await supabase.from("payments").insert([
                {
                    student_id: selectedStudentId,
                    amount,
                    date,
                    receipt_id: receiptId || null,
                },
            ]);

            if (error) throw error;

            // Reset fields
            setAmount(0);
            setReceiptId("");
            setDate(new Date().toISOString().split("T")[0]);

            // Optional refresh (Realtime will also update)
            const ids = students.map((s) => s.id);
            fetchPayments(ids);
        } catch (err: any) {
            alert("Payment Error: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    Loading Fee Workspace...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Fees Workspace
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Manage fee entries for your assigned students in realtime.
                    </p>
                </div>

                <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center space-x-3 shadow-sm ring-4 ring-slate-50/50">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        Payments
                    </span>
                </div>
            </div>

            {/* Add Payment Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <PlusCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            Add Fee Payment
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            instantly updates to parents
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Student */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Student
                        </p>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none"
                        >
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    #{s.rollNo} - {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Amount
                        </p>
                        <input
                            type="number"
                            value={amount === 0 ? "" : amount}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none"
                            placeholder="Enter amount"
                        />

                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Date
                        </p>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none"
                        />
                    </div>

                    {/* Receipt */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Receipt ID (optional)
                        </p>
                        <div className="relative">
                            <FileText className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                value={receiptId}
                                onChange={(e) => setReceiptId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none"
                                placeholder="ex: RCPT-1001"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={submitPayment}
                        disabled={isSubmitting}
                        className="px-8 py-3.5 font-black rounded-2xl transition-all shadow-xl flex items-center space-x-2 bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ReceiptIndianRupee className="w-5 h-5" />
                        )}
                        <span>{isSubmitting ? "Saving..." : "Save Payment"}</span>
                    </button>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        Recent Payment Records
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        fetched from database for all assigned students
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Roll No</th>
                                <th className="px-8 py-5">Student</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Receipt</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-50">
                            {payments.length > 0 ? (
                                payments.map((p) => {
                                    const student = studentMap[p.student_id];

                                    return (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-8 py-6 text-sm font-black text-indigo-600">
                                                #{student?.rollNo ?? "—"}
                                            </td>

                                            <td className="px-8 py-6 text-sm font-black text-slate-900">
                                                {student?.name ?? "Unknown Student"}
                                            </td>

                                            <td className="px-8 py-6 text-sm font-black text-emerald-600">
                                                ₹{Number(p.amount).toLocaleString()}
                                            </td>

                                            <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                                {p.date}
                                            </td>

                                            <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                                {p.receipt_id || "-"}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-8 py-32 text-center text-slate-400 font-black uppercase text-xs tracking-[0.2em]"
                                    >
                                        No payment records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherFees;
