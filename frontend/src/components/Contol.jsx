import { useEffect, useState } from "react";
import axios from "axios";
import Loading from "../Loading";
import "./control.css"


const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

function Control() {
    const [state, setState] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
    const [err, setErr] = useState(false);
    const [buttonName, setButtonName] = useState({});

    useEffect(() => {
        // Get button state
        axios.get(url + "/health").then((res) => {
            if (res.data?.status) {
                setState(res.data.data);
                setErr(true);
            }
        });

        // Get button names from /v2/buttons
        axios.get(url + "/buttons",{withCredentials:true}).then((res) => {
            if (Array.isArray(res.data?.buttonName)) {
                const nameMap = {};
                res.data.buttonName.forEach((item) => {
                    nameMap[item.data] = item.name;
                });
                setButtonName(nameMap);
                
            }
        });
    }, []);

    function getLabel(pin) {
        return buttonName[pin] || pin;
    }

    function submitHandler(e) {
        const index = parseInt(e.target.name.replace("pin", "")) - 1;

        const data1 = state.map((value, i) =>
            i === index ? (value === 0 ? 1 : 0) : value
        );

        const getData = async () => {
            try {
                const { data } = await axios.post(url + "/data", {
                    data: data1,
                });
                console.log("df", data?.msg);
                setErr(true);
            } catch (err) {
                console.log("err", err);
            }
        };
        getData();

        setState(data1);
    }

    const handleBatch = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.target.name === "of") {
            await axios.post(url + "/data", { data: Array(8).fill(0) });
            setState(Array(8).fill(0));
        } else {
            await axios.post(url + "/data", { data: Array(8).fill(1) });
            setState(Array(8).fill(1));
        }
    };

    return (
        <> 
        
        
            {!err && <Loading />}
            {err && (
                
                <div id="grid" onClick={submitHandler}>
                
                    <div className="grid_item">
                        {[...Array(8)].map((_, i) => {
                            const pin = `pin${i + 1}`;
                            return (
                                <button
                                    key={pin}
                                    name={pin}
                                    style={{ background: `${state[i] ? "red" : ""}` }}
                                    className="modern-button hover"
                                >
                                    {getLabel(pin)}
                                </button>
                            );
                        })}
                        <button
                            name="of"
                            className="modern-button-OFF hover"
                            onClick={handleBatch}
                        >
                            All OFF
                        </button>
                        <button
                            onClick={handleBatch}
                            name="on"
                            className="modern-button-ON hover"
                        >
                            All ON
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Control;
