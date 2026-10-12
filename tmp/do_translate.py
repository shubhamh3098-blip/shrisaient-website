import re

with open('src/components/showroom/CustomerShowroomView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    # Top announcement bar
    ('वर्धा भव्य दालन', 'Wardha Flagship Showroom'),
    ('श्री साई एंटरप्रायजेस • ३०-महिने लकी ड्रॉ बचत योजना, अस्सल सागवान फर्निचर व ब्रँडेड इलेक्ट्रॉनिक्स', 'Shree Sai Enterprises • 30-Month Lucky Draw Savings Scheme, Solid Teakwood Furniture & Branded Electronics'),
    ('दररोज: ९:३० AM – ९:३० PM', 'Open Daily: 9:30 AM – 9:30 PM'),
    ('WhatsApp चौकशी', 'WhatsApp Inquiry'),
    ('नमस्कार श्री साई एंटरप्रायजेस (वर्धा), मला फर्निचर, इलेक्ट्रॉनिक्स आणि ३०-महिने बचत योजनेबद्दल माहिती हवी आहे.', 'Hello Shree Sai Enterprises (Wardha), I would like information regarding furniture, electronics, and the 30-Month Weekly Savings Scheme.'),
    
    # Header
    ('वर्धा दालन', 'Wardha Showroom'),
    ('श्री साई एंटरप्रायजेस', 'Shree Sai Enterprises'),
    ('इलेक्ट्रॉनिक्स व सागवान फर्निचर भव्य दालन (आर्वी रोड)', 'Electronics & Solid Teak Furniture Showroom (Arvi Road)'),
    ('इलेक्ट्रॉनिक्स व सागवान फर्निचर भव्य दालन', 'Electronics & Solid Teak Furniture Showroom'),
    ('दालनाचा पत्ता', 'Showroom Address'),
    ('मातोश्री सभागृह समोर, आर्वी रोड, वर्धा', 'Opp. Matoshree Sabhagruh, Arvi Road, Wardha'),
    
    # Search & Categories dropdown
    ('सर्व दालन विभाग', 'All Departments'),
    ('स्मार्ट 4K टीव्ही', 'Smart 4K TVs'),
    ('सागवान सोफा सेट', 'Teakwood Sofas'),
    ('स्टोरेज दिवाण व कॉट', 'Storage Diwans & Beds'),
    ('फ्रिज, वॉशिंग मशीन, AC', 'Refrigerators & AC'),
    ('शोधा: स्मार्ट टीव्ही, सागवान सोफा, दिवाण कॉट, इन्व्हर्टर फ्रिज, ३०-महिने बचत योजना...', 'Search Smart 4K TVs, Teak Sofas, Diwans, Refrigerators, 30-Month Scheme...'),
    ('स्मार्ट टीव्ही, सागवान सोफा, दिवाण, योजना शोधा...', 'Search Smart TVs, Teak Sofas, Diwans, Scheme...'),
    
    # Header actions
    ('३०-महिने साप्ताहिक बचत योजना पासबुक', '30-Month Weekly Savings Scheme Passbook'),
    ('३०-महिने बचत योजना', '30-Month Scheme'),
    ('पासबुक तपासा', 'Check Passbook'),
    ('खरेदी कार्ट', 'Cart / Quote'),
    ('ERP डॅशबोर्ड', 'ERP Dashboard'),
    ('ERP लॉगिन (कर्मचारी व ॲडमिन पोर्टल)', 'ERP Login (Staff & Admin Portal)'),
    ('ERP लॉगिन', 'Staff ERP Login'),
    ('लॉगिन', 'Login'),
    
    # Subnav
    ('सर्व दालन स्टॉक', 'All Showroom Stock'),
    ('स्मार्ट 4K टीव्ही (Sony, Samsung, LG)', 'Smart 4K TVs (Sony, Samsung, LG)'),
    ('अस्सल सागवान सोफा सेट', 'Solid Teakwood Sofa Sets'),
    ('इन्व्हर्टर फ्रिज, वॉशिंग मशीन व AC', 'Inverter Refrigerators, Washers & AC'),
    ('३०-महिने साप्ताहिक बचत योजना (₹१०० - ₹२००/आठवडा)', '30-Month Weekly Savings Scheme (₹100–₹200/Week)'),
    
    # Hero buttons & WhatsApp
    ('नमस्कार श्री साई एंटरप्रायजेस (वर्धा), मला तुमच्या प्रॉडक्ट्सबद्दल चौकशी करायची आहे.', 'Hello Shree Sai Enterprises (Wardha), I would like to inquire about your products.'),
    ('नमस्कार श्री साई एंटरप्रायजेस (वर्धा), मला कोटेशन हवे आहे.', 'Hello Shree Sai Enterprises (Wardha), I would like to request a quotation.'),
    ('१००% ऑथॉराइज्ड वॉरंटी', '100% Authorized Warranty'),
    ('नमस्कार श्री साई एंटरप्रायजेस, मला प्रॉडक्ट्स आणि ३०-महिने बचत योजनेबद्दल माहिती हवी आहे.', 'Hello Shree Sai Enterprises, I would like information regarding products and the 30-Month Savings Scheme.'),
    ('WhatsApp संपर्क', 'WhatsApp Connect'),
    ('१००% हमी', '100% Genuine Quality'),
    ('साप्ताहिक हप्ता / बचत', 'Weekly Installment Option'),
    ('घरपोच डिलिव्हरी', 'Free Doorstep Delivery'),
    ('दालन स्टॉक पहा', 'Explore Collection'),
    
    # Showroom Offers
    ('दालन विशेष', 'Showroom Specials'),
    ('आजच्या भव्य दालन ऑफर्स व सणासुदीच्या सवलती', 'Exclusive Showroom Deals & Festive Offers'),
    ('मर्यादित कालावधीच्या विशेष सवलती • एका क्लिकवर WhatsApp द्वारे थेट बुक करा', 'Limited-Time Offers • Book Directly via WhatsApp with 1 Click'),
    ('सक्रिय ऑफर्स उपलब्ध', 'Active Offers Available'),
    ('या ऑफरबद्दल माहिती हवी आहे.', 'offer details.'),
    ('ऑफर क्लेम करा (WhatsApp)', 'Claim Offer (WhatsApp)'),
    
    # Trust Strip
    ('मोफत एक्सप्रेस डिलिव्हरी', 'Free Express Delivery'),
    ('वर्धा शहर व ५० किमी परिसर', 'Wardha City & 50 km Radius'),
    ('१००% अस्सल जीएसटी बिल', '100% Authentic GST Invoice'),
    ('कंपनीची ऑथॉराइज्ड वॉरंटी', 'Official Brand Warranty'),
    ('₹१०० - ₹२०० साप्ताहिक बचत', 'Weekly Savings from ₹100'),
    ('३०-महिने लकी ड्रॉ पासबुक योजना', '30-Month Lucky Draw Scheme'),
    ('०% सुलभ हप्ते (EMI)', '0% Interest Easy EMI'),
    ('बजाज व टीव्हीएस फायनान्स उपलब्ध', 'Bajaj & TVS Finance Available'),
    
    # Search Results & Sorting
    ('शोध रिझल्ट:', 'Search Results:'),
    ('उत्पादने सापडली.', 'products found.'),
    ('या नावाने उत्पादन उपलब्ध नाही.', 'No products found matching this name.'),
    ('सर्व उत्पादने दाखवा', 'Show All Products'),
    ('उत्पादने उपलब्ध', 'Products Available'),
    ('खास शिफारस (Featured)', 'Featured / Best Sellers'),
    ('किंमत: कमी ते जास्त', 'Price: Low to High'),
    ('किंमत: जास्त ते कमी', 'Price: High to Low'),
    ('दालन नवीन स्टॉकसाठी तयार', 'Showroom Ready for New Stock'),
    ('ERP पोर्टलमध्ये लॉगिन करून नवीन स्टॉक जोडा किंवा एक्सेल फाईल इम्पोर्ट करा.', 'Login to the ERP Portal to add new inventory or import from Excel/CSV.'),
    ('🔐 ERP पोर्टल लॉगिन (+ नवीन स्टॉक जोडा)', '🔐 ERP Portal Login (+ Add Stock)'),
    ('साठी कोणतेही उत्पादन सापडले नाही', 'No products found for'),
    ('कृपया स्पेलिंग तपासा किंवा वरील दालन विभागांमधून निवडा:', 'Please check the spelling or choose from our showroom categories:'),
    ('सागवान सोफा', 'Teakwood Sofas'),
    ('दिवाण कॉट', 'Diwan Beds'),
    
    # Product Cards
    ('सूट', 'OFF'),
    ('तपशील पहा (Quick View)', 'Quick View'),
    ('दालन बेस्ट सेलर', 'Showroom Best Seller'),
    ('४.८★ (वर्धा ग्राहक पसंती)', '4.8★ (Customer Favorite)'),
    ('१००% ऑथॉराइज्ड कंपनी वॉरंटी, जीएसटी बिल आणि मोफत घरपोच डिलिव्हरी.', '100% Authorized Brand Warranty, GST Invoice & Free Home Delivery.'),
    ('थेट बचत:', 'Instant Savings:'),
    ('३०-महिने बचत योजना:', '30-Month Scheme:'),
    ('/ आठवडा', '/ week'),
    ('०% डाऊनपेमेंट EMI उपलब्ध', '0% Down Payment EMI Available'),
    ('मोफत डिलिव्हरी', 'Free Delivery'),
    ('• वर्धा शहर व ५० किमी', '• Wardha City & 50 km'),
    ('कार्टमध्ये जोडा', 'Add to Cart'),
    ('नमस्कार श्री साई एंटरप्रायजेस (वर्धा), मला हे उत्पादन खरेदी करायचे आहे:', 'Hello Shree Sai Enterprises (Wardha), I would like to purchase this product:'),
    ('WhatsApp वर खरेदी करा', 'Order on WhatsApp'),
    
    # 30-Month Passbook Section
    ('श्री साई ३०-महिने साप्ताहिक बचत योजना • डिजिटल पासबुक', 'Shree Sai 30-Month Weekly Savings Scheme • Digital Passbook'),
    ('तुमच्या खात्याचा हप्ता व लकी ड्रॉ स्टेटस तपासा', 'Track Your Installment & Lucky Draw Status'),
    ('दर आठवड्याला फक्त ₹१०० किंवा ₹२०० भरून दरमहा भव्य लकी ड्रॉमध्ये फ्री फर्निचर व टीव्ही जिंका! खाली तुमचा कार्ड नंबर किंवा फोन नंबर टाकून खात्याची माहिती पहा:', 'Save just ₹100 or ₹200 weekly and participate in monthly lucky draws to win free appliances and furniture! Enter your card number or phone number below:'),
    ('placeholder="कार्ड नंबर (उदा. 1001) किंवा फोन नंबर..."', 'placeholder="Enter Card Number (e.g. 1001) or Mobile Number..."'),
    ('<span>शोधा</span>', '<span>Check Status</span>'),
    ('कार्ड #', 'Card #'),
    ('सभासद', 'Member'),
    ('पूर्ण पासबुक कार्ड उघडा', 'Open Full Passbook'),
    ('एकूण जमा रक्कम', 'Total Paid Amount'),
    ('साप्ताहिक हप्ता', 'Weekly Installment'),
    ('जमा हप्ते', 'Paid Weeks'),
    ('आठवडे जमा', 'Weeks Paid'),
    ('लकी ड्रॉ स्टेटस', 'Lucky Draw Status'),
    ('पात्र (Eligible)', 'Eligible'),
    ('प्रलंबित', 'Pending'),
    
    # Verified Showroom & Google Landmark
    ('व्हेरिफाईड शोभिवंत दालन', 'Verified Flagship Showroom'),
    ('वर्धा मुख्य शाखा', 'Wardha Main Branch'),
    ('SHREE SAI ENTERPRISES • वर्धा मुख्य दालन', 'SHREE SAI ENTERPRISES • Main Showroom'),
    ('१००% अस्सल सागवान लाकूड', '100% Solid Teakwood'),
    ('ब्रँडेड स्मार्ट टीव्ही व होम अप्लायन्सेस', 'Branded Smart TVs & Appliances'),
    ('दररोज उघडे: ९:३० AM ते ९:३० PM', 'Open Daily: 9:30 AM to 9:30 PM'),
    ('४.९', '4.9'),
    ('३५०+ ग्राहकांची पसंती', '350+ Verified Google Reviews'),
    ('#१ वर्ध्यातील विश्वसनीय दालन', '#1 Trusted Showroom in Wardha'),
    ('दालनाला प्रत्यक्ष भेट द्या', 'Visit Our Showroom in Person'),
    ('आज उघडे आहे', 'Open Today'),
    ('श्री साई एंटरप्रायजेस • भव्य इलेक्ट्रॉनिक्स व फर्निचर दालन', 'Shree Sai Enterprises • 2-Story Mega Showroom'),
    ('दोन मजली भव्य दालन: ग्राउंड फ्लोअरवर Samsung, LG, Sony स्मार्ट टीव्ही, फ्रिज, वॉशिंग मशीन आणि पहिल्या मजल्यावर अस्सल चंद्रपूर सागवान सोफा, दिवाण कॉट, डायनिंग टेबल आणि स्टील कपाट उपलब्ध.', 'Two-story grand showroom: Ground floor features Samsung, LG, Sony Smart TVs, refrigerators, and washing machines. First floor showcases genuine Chandrapur teakwood sofas, diwans, dining sets, and heavy-gauge steel almirahs.'),
    ('मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१', 'Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001'),
    ('Google Maps वर दिशा (Directions)', 'Get Directions on Google Maps'),
    ('कॉल करा: 8600122978', 'Call Store: 8600122978'),
    ('नमस्कार श्री साई एंटरप्रायजेस, मला दालनाला भेट द्यायची आहे.', 'Hello Shree Sai Enterprises, I am planning to visit the showroom.'),
    ('ग्राहकांचे प्रामाणिक अनुभव', 'Verified Customer Testimonials'),
    ('१००% खरे रिव्ह्यूज', '100% Real Reviews'),
    ('अमोल देशमुख (वर्धा)', 'Amol Deshmukh (Wardha)'),
    ('"३०-महिने बचत योजनेत आठवड्याला फक्त ₹१०० भरत होतो. दिवाळीच्या लकी ड्रॉमध्ये अस्सल सागवान सोफा लागला. उरलेले सर्व हप्ते माफ झाले. अत्यंत प्रामाणिक व्यवस्थापन!"', '"I was paying just ₹100 per week in the 30-month savings scheme. In the Diwali lucky draw, my number came up and I won a genuine teakwood sofa set! All remaining installments were waived off. Very honest and transparent showroom!"'),
    ('प्रदीप ठाकरे (आर्वी)', 'Pradeep Thakare (Arvi)'),
    ('"Samsung चा 55-इंच 4K स्मार्ट टीव्ही नागपूरपेक्षाही स्वस्त दरात मिळाला. त्याच दिवशी घरपोच डिलिव्हरी आणि वॉल-माउंटिंग फिटिंग करून दिली. नक्की भेट द्या!"', '"Got a 55-inch Samsung 4K Smart TV at a price cheaper than Nagpur! Same-day free delivery and wall-mounting installation done in Arvi. Best showroom in the district!"'),
    ('सुनीता वानखेडे (सेवाग्राम)', 'Sunita Wankhede (Sewagram)'),
    ('"हायड्रॉलिक स्टोरेज दिवाण आणि हेवी स्टील कपाट खूप मजबूत आहे. दालनातील स्टाफ खूप नम्र आणि मार्गदर्शक आहे. अस्सल लाकडाची खात्री मिळते."', '"Purchased a hydraulic storage diwan and heavy steel wardrobe. The wood finish is solid and premium. The showroom staff was very polite and helpful."'),
    ('दालनाची वेळ:', 'Showroom Hours:'),
    ('सोमवार ते रविवार: ९:३० AM ते ९:३० PM (आठवड्याचे सर्व ७ दिवस उघडे)', 'Monday to Sunday: 9:30 AM to 9:30 PM (Open all 7 days)'),
    
    # Value Pillars & FAQs
    ('वर्ध्यातील #१ इलेक्ट्रॉनिक्स व फर्निचर दालन • गुणवत्ता व हमी', 'Wardha’s #1 Electronics & Furniture Showroom • Quality & Trust'),
    ('वर्ध्यातील सर्वोत्तम इलेक्ट्रॉनिक्स, होम अप्लायन्सेस व फर्निचर', 'Best Price Guarantee on Electronics, Appliances & Furniture'),
    ('वर्ध्यामध्ये ब्रँडेड टीव्ही, फ्रिज, वॉशिंग मशीन किंवा अस्सल सागवान फर्निचर थेट कारखान्याच्या होलसेल दरात हवे आहे? श्री साई एंटरप्रायजेस येथे ०% फायनान्स, ५ वर्षांची वॉरंटी आणि मोफत घरपोच डिलिव्हरी उपलब्ध आहे.', 'Looking for branded 4K TVs, refrigerators, washing machines, or solid teakwood furniture in Wardha? Shree Sai Enterprises offers factory-direct wholesale pricing with 0% EMI, manufacturer warranties, and free home delivery.'),
    ('नमस्कार श्री साई एंटरप्रायजेस, मला वर्ध्यातील सर्वोत्तम दरांबद्दल चौकशी करायची आहे.', 'Hello Shree Sai Enterprises, I would like to inquire about your best prices and offers in Wardha.'),
    ('दर चौकशी करा (WhatsApp)', 'Inquire Best Prices (WhatsApp)'),
    ('गॅरंटीड सर्वोत्तम दर व थेट बचत', 'Guaranteed Best Prices & Direct Factory Savings'),
    ('कोणत्याही मध्यस्थाशिवाय थेट कारखाना दर. Sony, LG, Samsung स्मार्ट टीव्ही आणि अस्सल सागवान लाकडाच्या सोफा सेट्सवर बाजारापेक्षा मोठी थेट बचत.', 'Direct factory wholesale pricing with zero middlemen markup. Compare our prices on Sony, LG, Samsung Smart TVs and solid teakwood sofas across Vidarbha.'),
    ('१००% अधिकृत बिल व कंपनी वॉरंटी', '100% Authorized GST Invoice & Brand Warranty'),
    ('प्रत्येक टीव्ही, फ्रिज, कुलर आणि वॉशिंग मशीनवर अधिकृत कंपनीचे जीएसटी बिल, मॅन्युफॅक्चरर वॉरंटी आणि सर्व्हिस तंत्रज्ञ इन्स्टॉलेशन उपलब्ध.', 'Every TV, refrigerator, cooler, and washing machine comes with an authorized company GST invoice, manufacturer warranty, and free brand technician installation.'),
    ('संपूर्ण वर्धा जिल्हा मोफत डिलिव्हरी', 'Free Delivery Across Wardha District'),
    ('वर्धा, सेवाग्राम, देवळी, आर्वी, हिंगणघाट, सेलू, पुलगाव आणि लगतच्या गावांमध्ये मोफत घरपोच डिलिव्हरी व अनपॅकिंग सहाय्य.', 'Free safe doorstep delivery across Wardha, Sewagram, Deoli, Arvi, Hinganghat, Seloo, Pulgaon, and neighboring areas with unboxing support.'),
    ('नेहमी विचारले जाणारे प्रश्न (FAQ)', 'Frequently Asked Questions (FAQ)'),
    ('प्र: वर्ध्यातील सर्वोत्तम फर्निचर व इलेक्ट्रॉनिक्स दुकान कोणते आहे?', 'Q: Which is the best showroom for furniture and electronics in Wardha?'),
    ('उ: श्री साई एंटरप्रायजेस (मातोश्री सभागृह समोर, आर्वी रोड, वर्धा) हे ४.९★ रेटिंग असलेले सर्वात मोठे दालन आहे. येथे ब्रँडेड इलेक्ट्रॉनिक्स आणि चंद्रपूरचे अस्सल सागवान फर्निचर उपलब्ध आहे.', 'A: Shree Sai Enterprises (Opp. Matoshree Sabhagruh, Arvi Road, Wardha) is the largest showroom with a 4.9★ rating. We provide branded electronics and authentic Chandrapur teakwood furniture at wholesale rates.'),
    ('प्र: कमी बजेटमध्ये हप्त्यावर फर्निचर किंवा टीव्ही मिळू शकतो का?', 'Q: Can I purchase furniture or TVs on easy weekly installments or EMI?'),
    ('उ: हो! तुम्ही आठवड्याला फक्त ₹१०० किंवा ₹२०० भरून आमच्या ३०-महिने बचत योजनेत सहभागी होऊ शकता, किंवा ०% डाऊनपेमेंटवर बजाज/टीव्हीएस फायनान्सचा लाभ घेऊ शकता.', 'A: Yes! You can participate in our 30-Month Weekly Savings Scheme for just ₹100 or ₹200/week, or avail 0% down payment finance through Bajaj Finserv, TVS Credit, and HDB.'),
    ('प्र: दालनाची वेळ आणि संपर्क क्रमांक काय आहेत?', 'Q: What are your showroom timings and contact numbers?'),
    ('उ: दालन आठवड्याचे सर्व ७ दिवस सकाळी ९:३० ते रात्री ९:३० पर्यंत सुरू असते. संपर्क: 8600122978 / 8766486915.', 'A: The showroom is open all 7 days from 9:30 AM to 9:30 PM. Helpline: 8600122978 / 8766486915.'),
    ('प्र: ३०-महिने बचत योजनेचा लकी ड्रॉ कसा चालतो?', 'Q: How does the 30-Month Weekly Lucky Draw Scheme operate?'),
    ('उ: दरमहा पारदर्शक पद्धतीने लकी ड्रॉ काढला जातो. ज्या सभासदाचा नंबर लागतो, त्याला त्याचे उत्पादन लगेच मिळते आणि पुढील सर्व हप्ते १००% माफ होतात.', 'A: A transparent monthly lucky draw is conducted every month. If your card number is picked, you immediately receive your product, and all remaining installments are 100% waived off! Members who complete all installments receive guaranteed high-value gifts upon completion.'),
    
    # Footer
    ('श्री साई एंटरप्रायजेस • वर्धा दालन', 'Wardha Flagship Showroom'),
    ('वर्ध्यातील सर्वात प्रतिष्ठित आणि विश्वासू दालन. अस्सल चंद्रपूर सागवान फर्निचर, स्मार्ट टीव्ही, होम अप्लायन्सेस आणि लोकप्रिय ३०-महिने साप्ताहिक बचत योजना.', 'Wardha’s most trusted and reputed retail showroom. Authentic Chandrapur teakwood furniture, Smart 4K TVs, home appliances, and our celebrated 30-month weekly savings scheme.'),
    ('📍 मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१', '📍 Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001'),
    ('📞 हेल्पलाईन: ', '📞 Helpline: '),
    ('🌐 अधिकृत वेबसाईट: https://shrisaient.in', '🌐 Official Website: https://shrisaient.in'),
    ('इलेक्ट्रॉनिक्स विभाग (Wardha)', 'Electronics Department'),
    ('• स्मार्ट 4K UHD LED टीव्ही (32" ते 65")', '• Smart 4K UHD LED TVs (32" to 65")'),
    ('• इन्व्हर्टर डबल डोअर रेफ्रिजरेटर (LG, Whirlpool, Haier)', '• Inverter Double Door Refrigerators (LG, Whirlpool, Haier)'),
    ('• ५-स्टार ऑटोमॅटिक वॉशिंग मशीन', '• 5-Star Automatic Washing Machines'),
    ('• हेवी एअर कुलर व इन्व्हर्टर स्प्लिट AC', '• Heavy Desert Air Coolers & Inverter Split ACs'),
    ('• ०% डाऊनपेमेंट सुलभ हप्ते (EMI) फायनान्स', '• 0% Down Payment Easy EMI Finance'),
    ('सागवान फर्निचर विभाग (Wardha)', 'Teakwood Furniture Department'),
    ('• रॉयल अस्सल सागवान सोफा सेट (3+1+1)', '• Royal Solid Teakwood Sofa Sets (3+1+1)'),
    ('• हेवी स्टोरेज बॉक्स दिवाण (4x6 व 5x6)', '• Heavy Storage Box Diwans (4x6 & 5x6)'),
    ('• सागवान लाकडी किंग व क्वीन कॉट (डबल बेड)', '• Teakwood King & Queen Cots (Double Beds)'),
    ('• हेवी-गेज स्टील कपाट व गोदरेज टाईप अलमारी', '• Heavy-Gauge Steel Cupboards & Godrej-Type Almirahs'),
    ('• कारखान्याचे थेट दर व ५ वर्षांची वॉरंटी', '• Factory-Direct Pricing & 5-Year Wood Warranty'),
    ('३०-महिने बचत योजना', '30-Month Weekly Scheme'),
    ('दर आठवड्याला फक्त ₹१०० किंवा ₹२०० बचत करून मासिक लकी ड्रॉ जिंका किंवा ३० महिन्यांनी हमखास दर्जेदार फर्निचर व टीव्ही मिळवा.', 'Save just ₹100 or ₹200 weekly to participate in monthly lucky draws or receive guaranteed premium furniture at completion.'),
    ('डिजिटल पासबुक तपासा', 'Check Digital Passbook'),
    ('ERP पोर्टल (कर्मचारी व ॲडमिन)', 'Staff & Admin ERP Portal'),
    ('फिल्ड एजंट टर्मिनल', 'Field Agent Terminal'),
    ('श्री साई एंटरप्रायजेस (Shri Sai Enterprises), वर्धा. All rights reserved.', 'Shree Sai Enterprises, Wardha. All rights reserved.'),
    ('वर स्क्रोल करा (Back to Top)', 'Back to Top'),
    
    # Modals
    ('स्टॉक उपलब्ध • डिलिव्हरीसाठी तयार', 'In Stock • Ready for Same-Day Delivery'),
    ('मॉडेल: {quickViewProduct.model || quickViewProduct.code} • विभाग: ', 'Model: {quickViewProduct.model || quickViewProduct.code} • Department: '),
    ('\'अस्सल दर्जा, आकर्षक फिनिशिंग आणि अधिकृत कंपनी वॉरंटी.\'', '\'Authentic quality, premium finish, and official brand warranty.\''),
    ('💳 ३०-महिने बचत योजना: फक्त ₹१०० ते ₹२०० / आठवडा!', '💳 30-Month Savings Scheme: Just ₹100 to ₹200 / week!'),
    ('🚚 वर्धा शहर व ५० किमी परिसरात मोफत घरपोच डिलिव्हरी.', '🚚 Free doorstep delivery across Wardha city and within 50 km.'),
    ('<span>कार्टमध्ये जोडा</span>', '<span>Add to Cart</span>'),
    ('`नमस्कार श्री साई एंटरप्रायजेस, मला हे उत्पादन ऑर्डर करायचे आहे:\\nउत्पादन: ${quickViewProduct.name}', '`Hello Shree Sai Enterprises, I would like to order this product:\\nProduct: ${quickViewProduct.name}'),
    ('<span>WhatsApp द्वारे ऑर्डर करा</span>', '<span>Order via WhatsApp</span>'),
    ('तुमचे खरेदी कार्ट ({cartItemCount} वस्तू)', 'Your Shopping Cart ({cartItemCount} items)'),
    ('तुमचे कार्ट रिकामे आहे.', 'Your cart is currently empty.'),
    ('खरेदी सुरू करा', 'Start Shopping'),
    ('डिलिव्हरी व संपर्क तपशील:', 'Delivery & Contact Details:'),
    ('placeholder="तुमचे पूर्ण नाव (उदा. गजाननराव पवार)"', 'placeholder="Your Full Name (e.g. Rahul Sharma)"'),
    ('placeholder="मोबाईल नंबर (WhatsApp क्रमांक)"', 'placeholder="Mobile Number (WhatsApp preferred)"'),
    ('placeholder="डिलिव्हरी पत्ता किंवा गाव (उदा. आर्वी रोड, वर्धा)"', 'placeholder="Delivery Address / Area (e.g. Arvi Road, Wardha)"'),
    ('एकूण रक्कम:', 'Total Amount:'),
    ('<span>WhatsApp द्वारे ऑर्डर पाठवा</span>', '<span>Send Order via WhatsApp</span>'),
    ('साप्ताहिक बचत डिजिटल पासबुक व हप्ता रेकॉर्ड', 'Weekly Savings Digital Passbook & Ledger'),
    ('placeholder="कार्ड नंबर (उदा. 1001, 1050) किंवा मोबाईल नंबर टाका..."', 'placeholder="Enter Card Number (e.g. 1001, 1050) or Mobile Number..."'),
    ('कालावधी', 'Duration'),
    ('महिने (१३० आठवडे)', 'Months (130 Weeks)'),
    ('पात्र', 'Eligible'),
    ('प्रलंबित', 'Pending'),
    ('<span>पूर्ण ३०-महिने पासबुक कार्ड उघडा व १-पेज प्रिंट करा</span>', '<span>Open Full 30-Month Passbook Card & Print</span>'),
]

for old, new in replacements:
    text = text.replace(old, new)

# Also replace the WhatsApp order template in handleCheckoutSubmit
old_wa = '''    let msg = `*श्री साई एंटरप्रायजेस (SHRI SAI ENTERPRISES, WARDHA)*\\n`;
    msg += `(इलेक्ट्रॉनिक्स, होम अप्लायन्सेस व सागवान फर्निचर भव्य शोरूम)\\n`;
    msg += `📍 पत्ता: ${landingConfig.contactInfo.addressHindi || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001'}\\n`;
    msg += `📞 संपर्क: ${landingConfig.contactInfo.helpline1 || '8766486915'} | ${landingConfig.contactInfo.helpline2 || '8600122978'} | ${landingConfig.contactInfo.helpline3 || '9175537365'}\\n`;
    msg += `--------------------------------\\n`;
    if (customerName.trim()) msg += `👤 ग्राहक: *${customerName.trim()}*\\n`;
    if (customerPhone.trim()) msg += `📞 फोन: ${customerPhone.trim()}\\n`;
    if (customerAddress.trim()) msg += `📍 पत्ता: ${customerAddress.trim()}\\n`;
    msg += `दिनांक: ${new Date().toLocaleDateString('en-IN')}\\n`;
    msg += `--------------------------------\\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.stock.name}* (${item.stock.brand})\\n`;
      msg += `   नग: ${item.qty} | दर: ₹${item.stock.salePrice.toLocaleString('en-IN')} = ₹${(item.stock.salePrice * item.qty).toLocaleString('en-IN')}\\n`;
    });
    msg += `--------------------------------\\n`;
    msg += `💰 *एकूण रक्कम: ₹${cartTotalAmount.toLocaleString('en-IN')} (सर्व कर समाविष्ट)*\\n`;
    msg += `🚚 डिलिव्हरी: मोफत घरपोच डिलिव्हरी (वर्धा व ५० किमी परिसर)\\n`;
    msg += `--------------------------------\\n`;
    msg += `कृपया ऑर्डर कन्फर्म करा आणि डिलिव्हरी वेळ कळवा. धन्यवाद!`;'''

new_wa = '''    let msg = `*SHREE SAI ENTERPRISES (WARDHA)*\\n`;
    msg += `(Electronics, Home Appliances & Solid Teakwood Furniture Showroom)\\n`;
    msg += `📍 Address: ${landingConfig.contactInfo.address || 'Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001'}\\n`;
    msg += `📞 Helpline: ${landingConfig.contactInfo.helpline1 || '8766486915'} | ${landingConfig.contactInfo.helpline2 || '8600122978'} | ${landingConfig.contactInfo.helpline3 || '9175537365'}\\n`;
    msg += `--------------------------------\\n`;
    if (customerName.trim()) msg += `👤 Customer: *${customerName.trim()}*\\n`;
    if (customerPhone.trim()) msg += `📞 Phone: ${customerPhone.trim()}\\n`;
    if (customerAddress.trim()) msg += `📍 Address: ${customerAddress.trim()}\\n`;
    msg += `Date: ${new Date().toLocaleDateString('en-IN')}\\n`;
    msg += `--------------------------------\\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.stock.name}* (${item.stock.brand})\\n`;
      msg += `   Qty: ${item.qty} | Price: ₹${item.stock.salePrice.toLocaleString('en-IN')} = ₹${(item.stock.salePrice * item.qty).toLocaleString('en-IN')}\\n`;
    });
    msg += `--------------------------------\\n`;
    msg += `💰 *Total Amount: ₹${cartTotalAmount.toLocaleString('en-IN')} (All Taxes Included)*\\n`;
    msg += `🚚 Delivery: Free Doorstep Delivery (Wardha & 50 km Radius)\\n`;
    msg += `--------------------------------\\n`;
    msg += `Please confirm my order and share delivery schedule. Thank you!`;'''

text = text.replace(old_wa, new_wa)

with open('src/components/showroom/CustomerShowroomView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Translation script completed successfully!')
