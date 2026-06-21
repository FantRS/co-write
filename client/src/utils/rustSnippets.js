import { snippetCompletion } from "@codemirror/autocomplete";

export const rustCompletions = [
    // Keywords & Snippets
    snippetCompletion("fn ${name}(${}) {\n    ${}\n}", { label: "fn", detail: "function", type: "keyword" }),
    snippetCompletion("pub fn ${name}(${}) {\n    ${}\n}", { label: "pub fn", detail: "public function", type: "keyword" }),
    snippetCompletion("struct ${Name} {\n    ${}\n}", { label: "struct", detail: "struct definition", type: "keyword" }),
    snippetCompletion("enum ${Name} {\n    ${}\n}", { label: "enum", detail: "enum definition", type: "keyword" }),
    snippetCompletion("impl ${Name} {\n    ${}\n}", { label: "impl", detail: "implementation block", type: "keyword" }),
    snippetCompletion("trait ${Name} {\n    ${}\n}", { label: "trait", detail: "trait definition", type: "keyword" }),
    snippetCompletion("match ${expr} {\n    ${pattern} => ${result},\n}", { label: "match", detail: "match expression", type: "keyword" }),
    snippetCompletion("if ${cond} {\n    ${}\n}", { label: "if", detail: "if statement", type: "keyword" }),
    snippetCompletion("if let Some(${var}) = ${expr} {\n    ${}\n}", { label: "if let", detail: "if let pattern", type: "keyword" }),
    snippetCompletion("for ${i} in ${iter} {\n    ${}\n}", { label: "for", detail: "for loop", type: "keyword" }),
    snippetCompletion("while ${cond} {\n    ${}\n}", { label: "while", detail: "while loop", type: "keyword" }),
    snippetCompletion("loop {\n    ${}\n}", { label: "loop", detail: "infinite loop", type: "keyword" }),
    snippetCompletion("println!(\"${}\");", { label: "println!", detail: "macro", type: "function" }),
    snippetCompletion("format!(\"${}\")", { label: "format!", detail: "macro", type: "function" }),
    snippetCompletion("vec![${}]", { label: "vec!", detail: "macro", type: "function" }),
    
    // Simple Keywords
    { label: "let", type: "keyword" },
    { label: "mut", type: "keyword" },
    { label: "pub", type: "keyword" },
    { label: "return", type: "keyword" },
    { label: "use", type: "keyword" },
    { label: "mod", type: "keyword" },
    { label: "crate", type: "keyword" },
    { label: "type", type: "keyword" },
    { label: "const", type: "keyword" },
    { label: "static", type: "keyword" },
    { label: "async", type: "keyword" },
    { label: "await", type: "keyword" },
    { label: "unsafe", type: "keyword" },
    { label: "move", type: "keyword" },
    { label: "dyn", type: "keyword" },
    { label: "where", type: "keyword" },
    { label: "ref", type: "keyword" },
    
    // Built-in Types
    { label: "String", type: "type" },
    { label: "Vec", type: "type" },
    { label: "Option", type: "type" },
    { label: "Result", type: "type" },
    { label: "Box", type: "type" },
    { label: "Rc", type: "type" },
    { label: "Arc", type: "type" },
    { label: "HashMap", type: "type" },
    { label: "i32", type: "type" },
    { label: "u32", type: "type" },
    { label: "i64", type: "type" },
    { label: "u64", type: "type" },
    { label: "usize", type: "type" },
    { label: "isize", type: "type" },
    { label: "f32", type: "type" },
    { label: "f64", type: "type" },
    { label: "bool", type: "type" },
    { label: "char", type: "type" },
    { label: "str", type: "type" },
    { label: "Self", type: "type" },
    { label: "Some", type: "keyword" },
    { label: "None", type: "keyword" },
    { label: "Ok", type: "keyword" },
    { label: "Err", type: "keyword" },
    { label: "std", type: "namespace", detail: "standard library" }
];

export function rustAutocompleteSource(context) {
    // Match any word characters, possibly containing colons (e.g. std::collections::H)
    let pathWord = context.matchBefore(/[\w:]+/);
    
    // If no path word is found and this is not an explicit request (e.g. Ctrl+Space)
    if (!pathWord && !context.explicit) {
        return null;
    }
    
    let text = pathWord ? pathWord.text : "";
    
    // Check if the current token is a standard library path
    if (text.startsWith("std::")) {
        if (text.startsWith("std::collections::")) {
            return {
                from: pathWord.from + "std::collections::".length,
                options: [
                    { label: "HashMap", type: "type", detail: "std::collections::HashMap" },
                    { label: "HashSet", type: "type", detail: "std::collections::HashSet" },
                    { label: "BTreeMap", type: "type", detail: "std::collections::BTreeMap" },
                    { label: "BTreeSet", type: "type", detail: "std::collections::BTreeSet" },
                    { label: "VecDeque", type: "type", detail: "std::collections::VecDeque" },
                    { label: "BinaryHeap", type: "type", detail: "std::collections::BinaryHeap" },
                    { label: "LinkedList", type: "type", detail: "std::collections::LinkedList" }
                ]
            };
        }
        
        if (text.startsWith("std::io::")) {
            return {
                from: pathWord.from + "std::io::".length,
                options: [
                    { label: "stdin", type: "function", detail: "std::io::stdin" },
                    { label: "stdout", type: "function", detail: "std::io::stdout" },
                    { label: "stderr", type: "function", detail: "std::io::stderr" },
                    { label: "Read", type: "interface", detail: "std::io::Read" },
                    { label: "Write", type: "interface", detail: "std::io::Write" },
                    { label: "BufReader", type: "type", detail: "std::io::BufReader" },
                    { label: "BufWriter", type: "type", detail: "std::io::BufWriter" },
                    { label: "Result", type: "type", detail: "std::io::Result" },
                    { label: "Error", type: "type", detail: "std::io::Error" },
                    { label: "copy", type: "function", detail: "std::io::copy" }
                ]
            };
        }

        if (text.startsWith("std::fs::")) {
            return {
                from: pathWord.from + "std::fs::".length,
                options: [
                    { label: "File", type: "type", detail: "std::fs::File" },
                    { label: "read", type: "function", detail: "std::fs::read" },
                    { label: "write", type: "function", detail: "std::fs::write" },
                    { label: "read_to_string", type: "function", detail: "std::fs::read_to_string" },
                    { label: "create_dir", type: "function", detail: "std::fs::create_dir" },
                    { label: "remove_file", type: "function", detail: "std::fs::remove_file" },
                    { label: "metadata", type: "function", detail: "std::fs::metadata" }
                ]
            };
        }

        if (text.startsWith("std::env::")) {
            return {
                from: pathWord.from + "std::env::".length,
                options: [
                    { label: "args", type: "function", detail: "std::env::args" },
                    { label: "var", type: "function", detail: "std::env::var" },
                    { label: "set_var", type: "function", detail: "std::env::set_var" },
                    { label: "current_dir", type: "function", detail: "std::env::current_dir" },
                    { label: "current_exe", type: "function", detail: "std::env::current_exe" }
                ]
            };
        }

        if (text.startsWith("std::thread::")) {
            return {
                from: pathWord.from + "std::thread::".length,
                options: [
                    { label: "spawn", type: "function", detail: "std::thread::spawn" },
                    { label: "sleep", type: "function", detail: "std::thread::sleep" },
                    { label: "current", type: "function", detail: "std::thread::current" },
                    { label: "Thread", type: "type", detail: "std::thread::Thread" },
                    { label: "JoinHandle", type: "type", detail: "std::thread::JoinHandle" }
                ]
            };
        }

        if (text.startsWith("std::sync::mpsc::")) {
            return {
                from: pathWord.from + "std::sync::mpsc::".length,
                options: [
                    { label: "channel", type: "function", detail: "std::sync::mpsc::channel" },
                    { label: "sync_channel", type: "function", detail: "std::sync::mpsc::sync_channel" },
                    { label: "Sender", type: "type", detail: "std::sync::mpsc::Sender" },
                    { label: "SyncSender", type: "type", detail: "std::sync::mpsc::SyncSender" },
                    { label: "Receiver", type: "type", detail: "std::sync::mpsc::Receiver" }
                ]
            };
        }

        if (text.startsWith("std::sync::")) {
            return {
                from: pathWord.from + "std::sync::".length,
                options: [
                    { label: "Arc", type: "type", detail: "std::sync::Arc" },
                    { label: "Mutex", type: "type", detail: "std::sync::Mutex" },
                    { label: "RwLock", type: "type", detail: "std::sync::RwLock" },
                    { label: "Barrier", type: "type", detail: "std::sync::Barrier" },
                    { label: "Once", type: "type", detail: "std::sync::Once" },
                    { label: "mpsc", type: "namespace", detail: "std::sync::mpsc" }
                ]
            };
        }

        if (text.startsWith("std::time::")) {
            return {
                from: pathWord.from + "std::time::".length,
                options: [
                    { label: "Duration", type: "type", detail: "std::time::Duration" },
                    { label: "Instant", type: "type", detail: "std::time::Instant" },
                    { label: "SystemTime", type: "type", detail: "std::time::SystemTime" }
                ]
            };
        }

        if (text.startsWith("std::net::")) {
            return {
                from: pathWord.from + "std::net::".length,
                options: [
                    { label: "TcpListener", type: "type", detail: "std::net::TcpListener" },
                    { label: "TcpStream", type: "type", detail: "std::net::TcpStream" },
                    { label: "UdpSocket", type: "type", detail: "std::net::UdpSocket" },
                    { label: "IpAddr", type: "type", detail: "std::net::IpAddr" },
                    { label: "Ipv4Addr", type: "type", detail: "std::net::Ipv4Addr" },
                    { label: "Ipv6Addr", type: "type", detail: "std::net::Ipv6Addr" },
                    { label: "SocketAddr", type: "type", detail: "std::net::SocketAddr" }
                ]
            };
        }

        if (text.startsWith("std::path::")) {
            return {
                from: pathWord.from + "std::path::".length,
                options: [
                    { label: "Path", type: "type", detail: "std::path::Path" },
                    { label: "PathBuf", type: "type", detail: "std::path::PathBuf" }
                ]
            };
        }

        if (text.startsWith("std::fmt::")) {
            return {
                from: pathWord.from + "std::fmt::".length,
                options: [
                    { label: "Debug", type: "interface", detail: "std::fmt::Debug" },
                    { label: "Display", type: "interface", detail: "std::fmt::Display" },
                    { label: "Formatter", type: "type", detail: "std::fmt::Formatter" },
                    { label: "Result", type: "type", detail: "std::fmt::Result" }
                ]
            };
        }

        if (text.startsWith("std::iter::")) {
            return {
                from: pathWord.from + "std::iter::".length,
                options: [
                    { label: "Iterator", type: "interface", detail: "std::iter::Iterator" },
                    { label: "IntoIterator", type: "interface", detail: "std::iter::IntoIterator" },
                    { label: "FromIterator", type: "interface", detail: "std::iter::FromIterator" },
                    { label: "repeat", type: "function", detail: "std::iter::repeat" },
                    { label: "once", type: "function", detail: "std::iter::once" }
                ]
            };
        }

        if (text.startsWith("std::cmp::")) {
            return {
                from: pathWord.from + "std::cmp::".length,
                options: [
                    { label: "Ordering", type: "type", detail: "std::cmp::Ordering" },
                    { label: "PartialEq", type: "interface", detail: "std::cmp::PartialEq" },
                    { label: "PartialOrd", type: "interface", detail: "std::cmp::PartialOrd" },
                    { label: "Eq", type: "interface", detail: "std::cmp::Eq" },
                    { label: "Ord", type: "interface", detail: "std::cmp::Ord" },
                    { label: "min", type: "function", detail: "std::cmp::min" },
                    { label: "max", type: "function", detail: "std::cmp::max" }
                ]
            };
        }

        if (text.startsWith("std::convert::")) {
            return {
                from: pathWord.from + "std::convert::".length,
                options: [
                    { label: "From", type: "interface", detail: "std::convert::From" },
                    { label: "Into", type: "interface", detail: "std::convert::Into" },
                    { label: "TryFrom", type: "interface", detail: "std::convert::TryFrom" },
                    { label: "TryInto", type: "interface", detail: "std::convert::TryInto" },
                    { label: "AsRef", type: "interface", detail: "std::convert::AsRef" },
                    { label: "AsMut", type: "interface", detail: "std::convert::AsMut" }
                ]
            };
        }

        if (text.startsWith("std::str::")) {
            return {
                from: pathWord.from + "std::str::".length,
                options: [
                    { label: "from_utf8", type: "function", detail: "std::str::from_utf8" },
                    { label: "from_utf8_mut", type: "function", detail: "std::str::from_utf8_mut" }
                ]
            };
        }

        if (text.startsWith("std::slice::")) {
            return {
                from: pathWord.from + "std::slice::".length,
                options: [
                    { label: "from_ref", type: "function", detail: "std::slice::from_ref" },
                    { label: "from_mut", type: "function", detail: "std::slice::from_mut" }
                ]
            };
        }

        // Suggest the main standard library submodules
        return {
            from: pathWord.from + "std::".length,
            options: [
                { label: "collections", type: "namespace", detail: "std::collections" },
                { label: "io", type: "namespace", detail: "std::io" },
                { label: "fs", type: "namespace", detail: "std::fs" },
                { label: "env", type: "namespace", detail: "std::env" },
                { label: "thread", type: "namespace", detail: "std::thread" },
                { label: "sync", type: "namespace", detail: "std::sync" },
                { label: "time", type: "namespace", detail: "std::time" },
                { label: "net", type: "namespace", detail: "std::net" },
                { label: "path", type: "namespace", detail: "std::path" },
                { label: "fmt", type: "namespace", detail: "std::fmt" },
                { label: "iter", type: "namespace", detail: "std::iter" },
                { label: "cmp", type: "namespace", detail: "std::cmp" },
                { label: "convert", type: "namespace", detail: "std::convert" },
                { label: "str", type: "namespace", detail: "std::str" },
                { label: "slice", type: "namespace", detail: "std::slice" }
            ]
        };
    }
    
    // Otherwise fallback to normal word completions
    let word = context.matchBefore(/\w*/);
    if (word.from === word.to && !context.explicit) {
        return null;
    }
    return {
        from: word.from,
        options: rustCompletions
    };
}
