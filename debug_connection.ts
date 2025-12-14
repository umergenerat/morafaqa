
import { supabase } from './services/supabase';

export const checkConnection = async () => {
    console.log("Checking Supabase connection...");
    try {
        const { data, error, count } = await supabase
            .from('students')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error("Connection Check Failed:", error);
            alert(`فشل الاتصال بقاعدة البيانات!\nError: ${error.message}\nCode: ${error.code}`);
        } else {
            console.log("Connection Successful. Record count:", count);
            alert(`تم الاتصال بنجاح!\nعدد الطلاب في الاستعلام: ${count === null ? 'غير معروف' : count}\n(الاتصال يعمل)`);
        }
    } catch (err: any) {
        console.error("Unexpected Connection Error:", err);
        alert(`خطأ غير متوقع في الاتصال:\n${err.message}`);
    }
};
