import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function TermsOfServicePage() {

	return (
		<div className="min-h-screen bg-[#0f0f13] flex flex-col">
			<Navbar />
			<div className="flex-1 flex justify-center px-4 py-12">
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-8 w-full max-w-2xl">
					<h1 className="text-[#f0eeff] text-2xl font-semibold m-0">Terms of Service</h1>
					<p className="text-[#8892a4] text-xs mt-2 mb-8">Last updated: June 2026</p>
					<div className="flex flex-col gap-6">                                                                                                                         
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">Acceptance of Terms</h2>                                                                    
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">                                                                                            
  					            By creating an account and using ft_transcendence, you agree to these Terms of Service. If you do not agree, please do not use the platform.      
  					        </p>                                                                                                                                                  
  					    </div>                                                                                                                                                    
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">User Accounts</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">                                                                                            
  					            You are responsible for maintaining the confidentiality of your account credentials. You must provide a valid email address to register.
  					        </p>                                                                                                                                                  
  					    </div>      
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">Acceptable Use</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">
  					            You agree not to abuse the platform, attempt to hack or disrupt the service, or use it for any unlawful purpose.                                  
  					        </p>                                                                                                                                                  
  					    </div>                                                                                                                                                    
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">Termination</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">                                                                                            
  					            We reserve the right to suspend or terminate your account if you violate these terms.                                                             
  					        </p>
  					    </div>                                                                                                                                                    
  					</div> 
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default TermsOfServicePage