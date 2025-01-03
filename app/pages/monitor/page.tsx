'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import "./styles.css";

let lastEventTime = ''

const Monitor = () => {

	const [values, setValues] = useState<any>({banned: [], resources: [], cron: [], docker: []})
	const [copied, setCopied] = React.useState(false);

	const requestDocker = () => {
		fetch('/reports/docker.txt?x=' + new Date().toString())
			.then(a => a.text())
			.then(e => {
				setValues((newValues: any) => {
					return {
						...newValues,
						docker: [
							...e.split("\n").filter((a: string) => a.trim() !== "").map(a => a.split("--").map((e: string, i: number) => (e.indexOf("(") === -1 && i===1)
								? (e.replace('Up ', '') +" ❤️")
								: (e
									.replace('Up ', '')
									.replace("(healthy)", "❤️")
									.replace("(Paused)", "⏸️")
									.replace("(unhealthy)", "❤️‍🩹")
								)
							))
						],
					};
				})
			})
			.catch(e => console.error('Error', e));
	}

	const requestResources = useCallback(() => {
        fetch('/reports/computer.txt?x=' + new Date().toString())
			.then(a => a.text())
			.then(e => {
				setValues((newValues: any) => {
					const a = e.split("\n");
					return {
						...newValues,
						resources: [
							...a.slice(1,2).map(a => [...a.split(" ").filter(a => a!=="").slice(0, 2)]),
							...a.slice(3,6).map((a, i) => {
								const b = a.split("--")
								return [
									b[0],
									b[i === 0 ? 1 : 2]
								]
							}),
							...a.slice(8,12).map(x => {
								return x.split(" ").filter(a => a !== "").slice(0,2)
							}),
							...a.slice(13).map(x => {
								return x.split(" ").filter(a => a !== "").slice(0,2)
							}),
							
						]
					};
				})
			})
			.catch(e => console.error('Error', e));
	}, [setValues])

	

	const readableTime = (d: string) => d.replace(/(\d+)m(\d+)\.\d+s/, (match, m, s) => 
		`${String(m).padStart(2, '0')}:${String(Math.round(s)).padStart(2, '0')}`
	);

	function reverseInBlocks(arr: any[], blockSize: number) {
		if (blockSize <= 0) throw new Error("Block size must be greater than 0");
			
		const result = [];
		for (let i = arr.length; i > 0; i -= blockSize) {
			const block = arr.slice(i - blockSize, i);
			result.push(...block);
		}
		return result;
	}

	const requestCron = useCallback(() => {
		fetch('/reports/cron.txt?x=' + new Date().toString())
			.then(a => a.text())
			.then(e => {
				setValues((newValues: any) => {
					const x = e.split("\n").filter((a: any, i: number) => a !== undefined && a !== "" && a.indexOf("====")===-1)
					const y = x							
						.map((a: any, i: number) => i%5 === 0 && x[i+2] !== undefined ? [x[i+2].substring(0, x[i+2].indexOf(" ")).toUpperCase(), a.substring(5)] : a)
						.map((a: any, i: number) => i%5 === 1 ? [" ✅​ ", readableTime(a)] : a)
						.map((a: any, i: number) => i%5 === 3 ? [" ⬆️ ", readableTime(a)] : a)
						.filter((a: any, i: number) => [0, 1, 3].includes(i%5))
					
					return {
						...newValues,
						cron: reverseInBlocks(y, 3)
					};
				})
			})
			.catch(e => console.error('Error', e));
	}, [setValues])
	

	const requestAccess = useCallback(() => {
        fetch('/reports/access.txt?x=' + new Date().toString())
			.then(a => a.text())
			.then(e => {
				setValues((newValues: any) => {
						
					const x = e.split("----------------- --------------------")

					const banned = x[4].split("\n").filter(x => x !== "-" && x !== "")

					const access = [
						["############", "Last 48h"],
						...x[1].split("\n").map(a => a.split(" 20").map(a => a.replace("24-", "").replace("25-", "").replace("T", " at "))),
						["############", "Attempts"],
						...x[2].split("\n").map(a => {
							const x = a.split(" ").filter(a => a !== "")
							
							return [x[0], x[1]]
						}),
						["Banned", newValues.banned.length],
						["############", "Logins"],
						...x[3].split("\n").map(a => {
							const x = a.split(" ").filter(a => a !== "")
							return [x[0], x[1]]
						}),
					]
					
					return {

							...newValues,
							access: access.filter(a => a && a.join("").trim() !== ""),
							banned: [["Status", "IP"], ...[...(new Set(banned))].map(a => ["Blocked", a])],
					};
				})
			})
			.catch(e => console.error('Error', e));
	}, [setValues])

	const requestBannedIPs = () => {
	fetch('/reports/banned_ips_table.txt?x=' + new Date().toString())
		.then(a => a.text())
                .then(e => {
                        setValues((newValues: any) => {
                            const list = e.split("\n")
							
							return {
                                        ...newValues,
                                        list: list.map(a=>{
											const x = a.split("\t").filter((r: string) => r!=="")
											return x
											
										}).filter((a: string[]) => a.length === 3).map(x=> {
											
											return [
												x[0],
												x[1] + "❗​",
												x[2].replace(" 0 days 00:00:", "").replace(" 0 days 00:", "").replace(" 0 days ", "")
											]
										})
                                };
                        })
                })
		.catch(e => console.error('Error', e));
	}

	const reloadIframes = () => {
		return [
			//setInterval(requestOCS, 5000),
			setInterval(requestCron, 5000),
			setInterval(requestResources, 1500),
			setInterval(requestBannedIPs, 2500),
			setInterval(requestAccess, 1500),
			setInterval(requestDocker, 2500),
		];
	}

	const requestData = () => {
		//requestOCS();
		requestAccess();
		requestBannedIPs();
		requestCron();
		requestResources();
		requestDocker();
		
	}
	
	useEffect(() => {  
		const a = setTimeout(requestData, 60);
		
		const ids = reloadIframes();
		return () => {
			clearTimeout(a)
			ids.forEach(clearInterval)
		};
	}, []);

	const w = values.banned.map((b: string[]) => b[1].trim()).slice(1)

	const bannedIps = values.banned.map((a: string[]) => a[1]?.trim())
	
	const script = values.list ? values.list
		.filter((value: string[]) => 
			!bannedIps.includes(value[0])
		)
		.map((value: string[]) => 
			`iptables -A INPUT -s ${value[0]} -j DROP`
		)
		.join(" && ") : ""

	const handleCopy = () => {
		navigator.clipboard.writeText(script).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // Reset tooltip after 2 seconds
		});
	};

	const button = <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} arrow>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCopy}
		disabled={script===""}
        startIcon={<ContentCopyIcon />}
      >
        Copy
      </Button>
	</Tooltip>

	const parseValues = (array = [], suffix="") => {
		const x = array.filter((a: string[]) => a !== undefined && a.join && a.join("").trim() !== "" && !w.includes(a[0]?.trim()))
		return <table key={JSON.stringify(array)+suffix}>
			<tbody>
				{suffix === "b" && x.length > 0 && <tr><td colSpan={3}>{button}</td></tr>}
				{suffix === "b" && x.length === 0 && <tr><td colSpan={3}>No attackers found!</td></tr>}
				{x.map((a: string[], i) => <tr key={i} title={
					(a && a.length > 1 && a[1].includes && a[1].includes("❗​")) ? ("Failed access attempts " + a[1].replace("❗​", "")) : undefined
				}>
					{a !== undefined && a?.map((e, j)=><td key={j} style={{textAlign: (j> 0 ? "right" : "left"), padding: '0 8px',}}>
						{w.includes(a[0]?.trim())
							? <span style={{color: "red"}}>{e}</span>
							: e
						}
					</td>)}
				</tr>)}
			</tbody>
		</table>
	}

	

	return (
    <div className="my-frame">
		<div style={{ 
			padding: 0, 
			color: "white", 
			background: 'black', 
			height: 'calc(100% - 4px)', 
			overflow: 'hidden', 
			borderRadius: '4px',
			display: "inline-block"
		}}>
			<div
				id="resources"
				style={{
					height: 'calc(100% - 28px)',
					margin: '4px',
					display: "inline-block"
				}}
				title="Resources"
			>
				{parseValues(values.resources)}
			</div>
			<div
				id="docker"
				style={{
					height: 'calc(100% - 28px)',
					display: "inline-block"
				}}
				title="Docker"
			>{parseValues(values.docker)}</div>
    		<div
				id="cron"
				style={{
					height: 'calc(100% - 28px)',
					display: "inline-block"
				}}
				title="Cron"
			>
				<div className="cron-container">
					{parseValues(values.cron)}
				</div>
			</div>
			<div
        id="access"
        style={{
          display: 'inline-block',
          height: 'calc(100% - 28px)',
          
        }}
        title="Access report"
      >{parseValues(values.access, "x")}</div>
    
	<div
        id="banned"
        style={{
			height: 'calc(100% - 28px)',
          
		  display: 'inline-block',
        }}
        title="Failed access attempts"
      >
	  {parseValues(values.list, "b")}
	</div>
	</div>
		
    </div>
  );
};

export default Monitor;
