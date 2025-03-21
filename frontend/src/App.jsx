import { useEffect, useState } from "react";
import axios from "axios";

import Loading from "./Loading";
const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

function App() {
	const [state, setState] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
	const [err, setErr] = useState(false);

	useEffect(() => {
		//get stausc
		axios.get(url + "/health").then((res) => {
			if (res.data?.status) {
				setState(res.data.data);
				setErr(true);
			}
		});
	}, []);

	function submitHandler(e) {
		const index = parseInt(e.target.name.replace("pin", "")) - 1;

		const data1 = state.map((value, i) =>
			i == index ? (value == 0 ? 1 : 0) : value
		);

		const getData = async () => {
			try {
				const { data} = await axios.post(url + "/data", {
					data: data1,
				});
				console.log("df", data?.msg);
				setErr(true);
			} catch (err) {
				console.log("err",err);
			}
		};
		getData();

		setState(data1);
	}

	const handleBatch = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.target.name == "of") {
			await axios.post(url + "/data", { data: [0, 0, 0, 0, 0, 0, 0, 0] });
			setState([0, 0, 0, 0, 0, 0, 0, 0]);
		} else {
			await axios.post(url + "/data", { data: [1, 1, 1, 1, 1, 1, 1, 1] });
			setState([1, 1, 1, 1, 1, 1, 1, 1]);
		}
	};

	return (
		<>
			{!err && <Loading />}
			{err && (
				<div id="grid" onClick={submitHandler}>
					<div className="grid_item">
						<div style={{ marginLeft: "40px" }}>
							<h3 style={{ color: "#b22" }}>Made By Abhishek</h3>
						</div>
						<button
							style={{ background: `${state[0] ? "red" : ""}` }}
							name="pin1"
							className="modern-button hover"
						>
							pin 1
						</button>
						<button
							style={{ background: `${state[1] ? "red" : ""}` }}
							name="pin2"
							className="modern-button hover"
						>
							pin 2
						</button>
						<button
							style={{ background: `${state[2] ? "red" : ""}` }}
							name="pin3"
							className="modern-button hover"
						>
							pin 3
						</button>
						<button
							style={{ background: `${state[3] ? "red" : ""}` }}
							name="pin4"
							className="modern-button hover"
						>
							pin 4
						</button>
						<button
							style={{ background: `${state[4] ? "red" : ""}` }}
							name="pin5"
							className="modern-button hover"
						>
							pin 5
						</button>
						<button
							style={{ background: `${state[5] ? "red" : ""}` }}
							name="pin6"
							className="modern-button hover"
						>
							pin 6
						</button>
						<button
							style={{ background: `${state[6] ? "red" : ""}` }}
							name="pin7"
							className="modern-button hover"
						>
							pin 7
						</button>
						<button
							style={{ background: `${state[7] ? "red" : ""}` }}
							name="pin8"
							className="modern-button hover"
						>
							pin 8
						</button>
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

export default App;
