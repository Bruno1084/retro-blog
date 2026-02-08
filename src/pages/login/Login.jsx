import { useState } from "react";
import { supabase } from "../../lib/supabase";

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async() => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });

        if(error) {
            alert(error.message);
        } else {
            console.log('Usuario loggeado:', data.user);
        }
    };

    return (
        <div>
            <input placeholder="Email" type="email" onChange={e => setEmail(e.target.value)} />

            <input placeholder="Password" type="password"
                onChange={e => setPassword(e.target.value)}
            />

            <button onClick={handleLogin}>Log In</button>
        </div>
    );
}