"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready,       setReady]       = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    let expired = false;

    const timer = setTimeout(() => {
      expired = true;
      setLinkExpired(true);
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (!expired) clearTimeout(timer);
        setReady(true);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) {
      setError("حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى.");
    } else {
      setSuccess(true);
      setTimeout(() => router.replace("/auth"), 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#142844 100%)" }}
    >
      <JellyfishBackground />
      <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg glow-teal"
              style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.95" />
                <path d="M12 2v20M3 7l9 5 9-5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-heading font-bold text-white">Blumark24</div>
              <div className="text-sm text-[#22d3ee] font-medium">OS – نظام إدارة الأعمال</div>
            </div>
          </div>
          <p className="text-[#8ba3c7] text-sm">منصة متكاملة بالذكاء الاصطناعي للشركات السعودية</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-white font-heading font-bold text-xl mb-6 text-center">
            إعادة تعيين كلمة المرور
          </h2>

          {success ? (
            <div className="text-center space-y-3 py-2">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                تم تحديث كلمة المرور بنجاح
              </div>
              <p className="text-[#8ba3c7] text-sm">جارٍ تحويلك لصفحة تسجيل الدخول…</p>
            </div>
          ) : linkExpired ? (
            <div className="text-center space-y-4 py-2">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                رابط إعادة التعيين غير صالح أو منتهي الصلاحية
              </div>
              <button
                type="button"
                onClick={() => router.replace("/auth")}
                className="text-sm text-[#22d3ee]/70 hover:text-[#22d3ee] transition-colors hover:underline"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-[#22d3ee]/30 border-t-[#22d3ee] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#8ba3c7] text-sm">جارٍ التحقق من الرابط…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8ba3c7] mb-1.5">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className="input-dark pl-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#8ba3c7] mb-1.5">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="input-dark pl-10"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>تحديث كلمة المرور</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
