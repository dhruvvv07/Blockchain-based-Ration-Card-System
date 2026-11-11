import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import RationSystemData from './RationSystem.json';
import cvrLogo from './assets/cvr-logo.png';
import deptLogo from './assets/dept-logo.png';
import './App.css';

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const mockDatabase = {
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": {
    head: "K. Srinivasa Rao",
    dep1: "K. Lakshmi",
    dep2: "K. Rahul"
  },
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": {
    head: "M. Venkat Reddy",
    dep1: "M. Sunitha",
    dep2: "M. Arjun"
  },
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": {
    head: "P. Rajeshwari",
    dep1: "P. Karthik",
    dep2: "P. Divya"
  }
};

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [contract, setContract] = useState(null);
  
  const [activeTab, setActiveTab] = useState("home");

  const [citizenAddress, setCitizenAddress] = useState("");
  const [quota, setQuota] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  
  const [searchAddress, setSearchAddress] = useState("");
  const [searchDetails, setSearchDetails] = useState(null);

  // Reference for the PDF generator to know what to capture
  const printRef = useRef();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const rationContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          RationSystemData.abi,
          signer
        );
        setContract(rationContract);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect wallet first.");
    try {
      const tx = await contract.registerBeneficiary(citizenAddress, quota);
      await tx.wait(); 
      alert("Citizen registered successfully!");
      setCitizenAddress("");
      setQuota("");
    } catch (error) {
      console.error(error);
      alert("Registration failed. Are you sure you are the Admin?");
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect wallet first.");
    try {
      const tx = await contract.claimRation(claimAmount);
      await tx.wait();
      alert(`Successfully claimed ${claimAmount} kg of rations!`);
      setClaimAmount("");
    } catch (error) {
      console.error(error);
      alert("Claim failed. Do you have enough quota?");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect wallet first.");
    try {
      const details = await contract.beneficiaries(searchAddress);
      
      const addressKey = searchAddress.toLowerCase();
      const familyInfo = mockDatabase[addressKey] || {
        head: "Unrecognized Beneficiary",
        dep1: "Unknown",
        dep2: "Unknown"
      };

      const shortAddress = searchAddress.substring(2, 8).toUpperCase();
      
      setSearchDetails({
        isVerified: details[0],
        quota: details[1].toString(),
        balance: details[2].toString(),
        rationCardNo: "3654" + shortAddress,
        fscRefNo: "FSC" + shortAddress + "99",
        cardType: "FSC (White)",
        appStatus: details[0] ? "Approved" : "Unregistered",
        headOfFamily: details[0] ? familyInfo.head : "N/A",
        dependent1: familyInfo.dep1,
        dependent2: familyInfo.dep2,
        district: "Rangareddy",
        officeName: "Ibrahimpatnam",
        fpShopNo: "1765432",
        gasConnection: "Deepam",
      });
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to fetch details. Check the address.");
    }
  };

  // Function to capture the card and generate the PDF
 // Function to capture the card and generate the PDF
  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    // Use html2canvas to capture the element as an image
    // scrollY fixes any issues if the user has scrolled down the page
    const canvas = await html2canvas(element, { 
      scale: 2,
      scrollY: -window.scrollY 
    });
    
    const imgData = canvas.toDataURL('image/png');

    // Create PDF (Landscape orientation)
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate the perfect scale ratio to fit both width AND height on one page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Center the card on the PDF page
    const xOffset = (pageWidth - finalWidth) / 2;
    const yOffset = (pageHeight - finalHeight) / 2;

    // Add image and save
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    pdf.save(`RationCard_${searchDetails.rationCardNo}.pdf`);
  };

  return (
    <div className="App">
      <header className="header-banner">
        <div className="logo-placeholder">
          <img src={cvrLogo} alt="CVR Logo" className="header-logo" />
        </div>
        
        <div className="header-titles">
          <h1>CVR COLLEGE OF ENGINEERING</h1>
          <h2>BLOCKCHAIN RATION CARD SYSTEM</h2>
        </div>
        
        <div className="logo-placeholder right">
          <img src={deptLogo} alt="Department Logo" className="header-logo" /> 
        </div>
      </header>
      
      <div className="connection-bar">
        {!walletAddress ? (
          <button className="connect-btn" onClick={connectWallet}>Connect MetaMask</button>
        ) : (
          <span><strong>Connected Wallet:</strong> {walletAddress}</span>
        )}
      </div>

      <nav className="navbar">
        <button className={activeTab === 'home' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('home')}>HOME</button>
        <button className={activeTab === 'details' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('details')}>DETAILS</button>
        <button className={activeTab === 'admin' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('admin')}>ADMIN</button>
        <button className={activeTab === 'citizen' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('citizen')}>CITIZEN</button>
      </nav>

      <main className="main-content">
        
        {activeTab === 'home' && (
          <div className="portal-panel">
            <div className="panel-header">SYSTEM INFORMATION</div>
            <div className="panel-body landing-page">
              <h3>Welcome to the Decentralized Public Distribution System</h3>
              <p>This blockchain-powered web application ensures transparency, immutability, and security in the allocation and distribution of ration quotas.</p>
              <ul>
                <li><strong>Immutable Ledgers:</strong> All registrations and claims are permanently recorded on the blockchain.</li>
                <li><strong>Smart Contract Verification:</strong> Mathematical enforcement of quotas prevents over-claiming and fraud.</li>
                <li><strong>Role-Based Access:</strong> Strict separation of privileges between administrators and citizens.</li>
              </ul>
              <p><em>Developed for academic demonstration at CVR College of Engineering.</em></p>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="portal-panel">
            <div className="panel-header">FSC Ration Card Search</div>
            <div className="panel-search-bar">
              <form onSubmit={handleSearch} className="search-form">
                <label>Enter Citizen Address:</label>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)} 
                  required 
                />
                <button type="submit" className="search-btn">Search</button>
              </form>
            </div>
            
            {searchDetails && (
              <div className="details-results-container">
                {/* Download Button Section */}
                <div className="download-section">
                  <button onClick={downloadPDF} className="action-btn download-btn">Download e-Card (PDF)</button>
                </div>

                {/* The area that gets captured for the PDF */}
                <div className="details-results printable-card" ref={printRef}>
                  
                  {/* We add a title specifically for the PDF so it looks official */}
                  <div className="pdf-card-header">
                    <h2>FSC RATION CARD</h2>
                    <p>Government of Telangana - Civil Supplies Department</p>
                  </div>

                  <div className="panel-header light">RATION CARD DETAILS</div>
                  <div className="table-responsive">
                    <table className="details-table">
                      <tbody>
                        <tr>
                          <td className="label">New Ration Card No :</td>
                          <td className="value">{searchDetails.rationCardNo}</td>
                          <td className="label">FSC Reference No. :</td>
                          <td className="value">{searchDetails.fscRefNo}</td>
                          <td className="label">Card Type :</td>
                          <td className="value">{searchDetails.cardType}</td>
                          <td className="label">Application Status :</td>
                          <td className="value"><strong>{searchDetails.appStatus}</strong></td>
                        </tr>
                        <tr>
                          <td className="label">Application No :</td>
                          <td className="value">APP{searchDetails.fscRefNo}</td>
                          <td className="label">SKS Form No :</td>
                          <td className="value">SKS-2026</td>
                          <td className="label">Office Name :</td>
                          <td className="value">{searchDetails.officeName}</td>
                          <td className="label">FPShop No :</td>
                          <td className="value">{searchDetails.fpShopNo}</td>
                        </tr>
                        <tr>
                          <td className="label">Head of the Family :</td>
                          <td className="value">{searchDetails.headOfFamily}</td>
                          <td className="label">District :</td>
                          <td className="value">{searchDetails.district}</td>
                          <td className="label">Wallet Address :</td>
                          <td className="value" colSpan="3" style={{wordBreak: "break-all", fontSize: "12px"}}>{searchAddress}</td>
                        </tr>
                        <tr>
                          <td className="label">Gas Connection :</td>
                          <td className="value">{searchDetails.gasConnection}</td>
                          <td className="label">Consumer No :</td>
                          <td className="value">100987654</td>
                          <td className="label blockchain-data">Monthly Quota :</td>
                          <td className="value blockchain-data-val">{searchDetails.quota} kg</td>
                          <td className="label blockchain-data">Remaining Balance :</td>
                          <td className="value blockchain-data-val">{searchDetails.balance} kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="panel-header light" style={{marginTop: '10px'}}>RATION CARD MEMBER DETAILS</div>
                  <div className="table-responsive">
                    <table className="details-table">
                      <thead>
                        <tr>
                          <th className="label" style={{textAlign: 'center', width: '20%'}}>S No</th>
                          <th className="label" style={{textAlign: 'center', width: '80%'}}>Member Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="value" style={{textAlign: 'center'}}>1</td>
                          <td className="value" style={{textAlign: 'center'}}>{searchDetails.headOfFamily}</td>
                        </tr>
                        {searchDetails.isVerified && (
                          <>
                            <tr>
                              <td className="value" style={{textAlign: 'center'}}>2</td>
                              <td className="value" style={{textAlign: 'center'}}>{searchDetails.dependent1}</td>
                            </tr>
                            <tr>
                              <td className="value" style={{textAlign: 'center'}}>3</td>
                              <td className="value" style={{textAlign: 'center'}}>{searchDetails.dependent2}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="portal-panel">
            <div className="panel-header">ADMIN: REGISTER CITIZEN</div>
            <div className="panel-body">
              <form onSubmit={handleRegister} className="portal-form">
                <div className="form-row">
                  <label>Citizen's Wallet Address:</label>
                  <input
                    type="text"
                    value={citizenAddress}
                    onChange={(e) => setCitizenAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Monthly Quota (in kg):</label>
                  <input
                    type="number"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="action-btn">Register Citizen</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'citizen' && (
          <div className="portal-panel">
            <div className="panel-header">CITIZEN: CLAIM RATIONS</div>
            <div className="panel-body">
              <form onSubmit={handleClaim} className="portal-form">
                <div className="form-row">
                  <label>Amount to Claim (in kg):</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="action-btn">Process Claim</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;