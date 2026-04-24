import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useTranslation } from "react-i18next"

function TermsOfServicePage() {
	const { t } = useTranslation()

	return (
		<div className="min-h-screen bg-[#0f0f13] flex flex-col">
			<Navbar />
			<div className="flex-1 flex justify-center px-4 py-12">
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-8 w-full max-w-2xl">
					<h1 className="text-[#f0eeff] text-2xl font-semibold m-0">{t('terms.title')}</h1>
					<p className="text-[#8892a4] text-xs mt-2 mb-8">{t('terms.lastUpdated')}</p>
					<div className="flex flex-col gap-6">                                                                                                                         
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">{t('terms.section1Title')}</h2>                                                                    
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">{t('terms.section1Text')}</p>                                                                                                                                                  
  					    </div>                                                                                                                                                    
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">{t('terms.section2Title')}</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">{t('terms.section2Text')}</p>                                                                                                                                                  
  					    </div>      
  					    <div>                                                                                                                                                     
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">{t('terms.section3Title')}</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">{t('terms.section3Text')}</p>                                                                                                                                                  
  					    </div>                                                                                                                                                    
  					    <div>
  					        <h2 className="text-[#f0eeff] text-base font-medium mb-2">{t('terms.section4Title')}</h2>
  					        <p className="text-[#8892a4] text-sm leading-relaxed m-0">{t('terms.section4Text')}</p>
  					    </div>
						<div>
							<h2 className="text-[#f0eeff] text-base font-medium mb-2">{t('terms.section5Title')}</h2>
							<p className="text-[#8892a4] text-sm leading-relaxed m-0">{t('terms.section5Text')}</p>
						</div>
						<div>
							<h2 className="text-[#f0eeff] text-base font-medium mb-2">{t('terms.section6Title')}</h2>
							<p className="text-[#8892a4] text-sm leading-relaxed m-0">{t('terms.section6Text')}</p>
						</div>
  					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default TermsOfServicePage