'use client'

const WeatherAndReports = () => {

	return (
    <div style={{fontSize: "30px", background: "#222", margin: "100px auto", width: "800px", height: "400px", verticalAlign: "middle"}}>
      <ul style={{listStyleType: "none"}}>
        <li style={{padding: "8px"}}>
          <a style={{textDecoration: "none", color: "white"}} href={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/reports/report_cloud.html"}>
            <img style={{margin: "0 4px"}} height="26" width="26" src={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/core/preview?fileId=47020&x=1920&y=1080&a=true&etag=c9bab916602836e6a5fe852e66890024"}></img>
            Nginx report for cloud.ideniox.com
          </a>
        </li>
        <li style={{padding: "8px"}}>
          <a style={{textDecoration: "none", color: "white"}} href={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/reports/report_bitcoin.html"}>
            <img style={{margin: "0 4px"}} height="26" width="26" src={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/core/preview?fileId=47020&x=1920&y=1080&a=true&etag=c9bab916602836e6a5fe852e66890024"}></img>
            Nginx report for bitcoinprivacy.net
          </a>
        </li>
        <li style={{padding: "8px"}}>
          <a style={{textDecoration: "none", color: "white"}} href={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/reports/report_ideniox.html"}>
            <img style={{margin: "0 4px"}} height="26" width="26" src={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/core/preview?fileId=31375&x=1920&y=1080&a=true&etag=1c029b213cdca0de1a5f0f602a8721e5"}></img>
            Nginx report for ideniox.com
          </a>
        </li>
        <li style={{padding: "8px"}}>
          <a style={{textDecoration: "none", color: "white"}} href={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/reports/report_math.html"}>
            <img style={{margin: "0 4px"}} height="26" width="26" src={process.env.NEXT_PUBLIC_NEXTCLOUD_URL+"/core/preview?fileId=47020&x=1920&y=1080&a=true&etag=c9bab916602836e6a5fe852e66890024"}></img>
            Nginx report for math.ideniox.com
          </a>
        </li>
      </ul>
    </div>
  );
};

export default WeatherAndReports;

