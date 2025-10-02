import { useEffect, useState } from "react";
import axios from "axios";

const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

const defaultButtons = [
    { data: "pin1", name: "" },
    { data: "pin2", name: "" },
    { data: "pin3", name: "" },
    { data: "pin4", name: "" },
    { data: "pin5", name: "" },
    { data: "pin6", name: "" },
    { data: "pin7", name: "" },
    { data: "pin8", name: "" },
];

function EditButtonLabels() {
    const [buttons, setButtons] = useState(defaultButtons);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(url + "/buttons",{withCredentials:true})
            .then((res) => {
                if (Array.isArray(res.data?.buttonName)) {
                    setButtons(res.data.buttonName);
                }
            })
            .catch(() => {
                setButtons(defaultButtons);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (index, value) => {
        const updated = [...buttons];
        updated[index].name = value;
        setButtons(updated);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        console.log("button :",buttons);
        try {
            await axios.post(url + "/setButton", {
                buttons: buttons
            },{
                withCredentials:true
            });
            alert("All button names updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update buttons.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>Edit All Button Labels</h2>
            {buttons.map((btn, index) => (
                <div key={btn.data} style={{ marginBottom: "10px" }}>
                    <label style={{ marginRight: "10px", width: "50px", display: "inline-block" }}>
                        {btn.data}
                    </label>
                    <input
                        type="text"
                        value={btn.name}
                        placeholder={`Enter name for ${btn.data}`}
                        onChange={(e) => handleChange(index, e.target.value)}
                        style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                </div>
            ))}

            <button
                onClick={handleSaveAll}
                disabled={saving}
                style={{
                    marginTop: "20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                }}
            >
                {saving ? "Saving..." : "Save All"}
            </button>
        </div>
    );
}

export default EditButtonLabels;
