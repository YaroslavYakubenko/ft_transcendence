import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function PrivacyPolicyPage() {

	return (
		<div className="min-h-screen bg-[#0f0f13] flex flex-col">
			<Navbar />
			<div className="flex-1 flex justify-center px-4 py-12">
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-8 w-full max-w-2xl">
					<h1 className="text-[#f0eeff] text-2xl font-semibold m-0">Privacy Policy</h1>
					<p className="text-[#8892a4] text-xs mt-2 mb-8">Last updated: June 2026</p>
					<div className="flex flex-col gap-6">                                                                                                                         
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">Information We Collect</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">                                                                                            
  					            We collect your email address and password when you register. We also store your game statistics such as wins, losses, and rank.                  
  					        </p>                                                                                                                                                  
  					    </div>                                                                                                                                                    
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">How We Use Your Information</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">                                                                                            
  					            Your information is used solely to authenticate you and display your game statistics. We do not share your data with third parties.
  					        </p>                                                                                                                                                  
  					    </div>      
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">Data Storage</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">                                                                                            
  					            Your data is stored securely on our servers. We take reasonable measures to protect your information from unauthorized access.                    
  					        </p>
  					    </div>                                                                                                                                                    
  					    <div>       
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">Contact</h2>                                                                                
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">
  					            If you have any questions about this Privacy Policy, please contact us through the platform.                                                      
  					        </p>                                                                                                                                                  
  					    </div>                                                                                                                                                    
  					</div> 
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default PrivacyPolicyPage