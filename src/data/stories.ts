import { Story, CoinPackage } from '@/types';
import storiesMetadataData from './stories_metadata.json';

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack_20k', coins: 200, bonusCoins: 0, priceVnd: 20000 },
  { id: 'pack_50k', coins: 500, bonusCoins: 50, priceVnd: 50000, popular: true },
  { id: 'pack_100k', coins: 1000, bonusCoins: 200, priceVnd: 100000 },
  { id: 'pack_200k', coins: 2000, bonusCoins: 500, priceVnd: 200000 },
];

const DEFAULT_STORIES: Story[] = [
  {
    id: 'story-1',
    slug: 'dai-phung-da-canh-nhan',
    title: 'Đại Phụng Đả Canh Nhân',
    author: 'Mại Báo Tiểu Lang Quân',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    description: 'Hứa Thất An, một cảnh sát hình sự hiện đại bất ngờ xuyên không vào thế giới huyền huyễn của vương triều Đại Phụng. Vừa mở mắt ra, hắn đã thấy mình đang ở trong đại lao, sắp sửa bị lưu đày biên ải. Bằng tài trí phá án và sự am hiểu tâm lý thời hiện đại, hắn từng bước giải khai những vụ kỳ án chấn động triều đình, gia nhập tổ chức Đả Canh Nhân và bước lên đỉnh phong thiên hạ.',
    categories: ['Tiên Hiệp', 'Huyền Huyễn', 'Xuyên Không', 'Trinh Thám'],
    status: 'Hoàn thành',
    views: 1428500,
    rating: 4.9,
    ratingCount: 3820,
    chaptersCount: 3,
    updatedAt: '2026-10-10',
    chapters: [
      {
        id: 'chap-1-1',
        number: 1,
        title: 'Chương 1: Mở mắt trong đại lao',
        publishedAt: '2026-10-01',
        wordCount: 1850,
        isVip: false,
        content: `Một mùi ẩm mốc xen lẫn mùi rỉ sét nồng nặc xộc thẳng vào cánh mũi.

Hứa Thất An nhíu mày, cảm giác đầu đau như búa bổ. Cơn đau âm ỉ nơi thái dương khiến hắn theo bản năng giơ tay lên xoa bóp, nhưng ngay khoảnh khắc chuyển động cánh tay, âm thanh kim loại va chạm leng keng lanh lảnh vang lên bên tai.

"Leng keng..."

Cái gì thế này?

Hắn bừng tỉnh mở mắt. Ánh sáng mờ mịt từ một ô cửa sổ nhỏ cao tít trên trần nhà rọi xuống, xuyên qua lớp bụi mờ ảo chiếu lên nền đá ẩm ướt lấm tấm rêu phong. Trước mặt hắn là những thanh song sắt to bằng cổ tay, đen ngòm và lạnh lẽo.

Đây tuyệt đối không phải là phòng trọ quen thuộc ở thành phố, cũng không phải là văn phòng đội cảnh sát hình sự nơi hắn đã thức trắng ba đêm để phân tích hồ sơ vụ án ma túy trọng điểm.

Dưới thân là một đống rơm rạ khô khốc bốc mùi hôi thối. Trên cổ tay và cổ chân hắn là hai chiếc cùm sắt nặng trĩu.

"Đau đầu quá..."

Một luồng ký ức khổng lồ, hỗn loạn và sắc bén như lưỡi dao bất ngờ tràn ập vào tâm trí hắn không báo trước.

Ký ức của một thanh niên mười chín tuổi: Hứa Thất An, tự Ninh Yến, xuất thân từ một gia đình quân hộ ở kinh thành Đại Phụng. Cha mẹ mất sớm, được thúc phụ Hứa Bình Chí nuôi nấng. Thúc phụ là Ngự Đao Vệ Bách hộ, người tính tình cương trực nhưng có phần chất phác.

Cách đây ba ngày, vụ án trộm ngân lượng thuế khóa chấn động kinh sư bùng nổ. Thúc phụ Hứa Bình Chí phụ trách áp tải mười vạn lượng bạc thuế vào quốc khố, nhưng khi mở hòm ra kiểm tra thì toàn bộ bạc trắng biến thành đá cuội!

Theo luật pháp Đại Phụng: Mất ngân lượng thuế khóa là trọng tội mưu nghịch hại nước hại dân, tru di tam tộc hoặc toàn gia lưu đày biên ải, nam sung quân, nữ sung vào giáo phường ty!

"Toang rồi..."

Hứa Thất An hít một hơi khí lạnh, trái tim đập thình thịch trong lồng ngực. Hắn không những xuyên không, mà còn rơi vào hoàn cảnh bi thảm nhất của một người xuyên việt: Tử tù chờ ngày phán quyết!`
      },
      {
        id: 'chap-1-2',
        number: 2,
        title: 'Chương 2: Manh mối mười vạn lượng bạc',
        publishedAt: '2026-10-02',
        wordCount: 2100,
        isVip: false,
        content: `Tiếng bước chân nặng nề vang lên từ hành lang ngục tối.

Hai tên sai dịch mặc y phục sai nha màu đen viền đỏ, hông đeo đao ngắn, tay cầm đuốc tiến lại gần phòng giam. Ánh lửa bập bùng soi rõ khuôn mặt tái nhợt nhưng ánh mắt sắc bén lạ thường của Hứa Thất An.

"Hứa Thất An, ra ngoài! Hộ Bộ thị lang cùng Hình Bộ quan gia muốn hỏi cung ngươi một lần cuối trước khi định tội."

Tên ngục tốt mở khóa lách cách, đẩy cánh cửa sắt gỉ sét kêu kẽo kẹt rợn người.

Hứa Thất An hít sâu một hơi để ổn định lại tâm lý. Ở kiếp trước, hắn là thủ khoa Học viện Cảnh sát, chuyên gia điều tra dấu vết tội phạm và tâm lý học hành vi. Hắn biết rất rõ: Trong một vụ án lớn như biến mất mười vạn lượng bạc giữa ban ngày ban mặt, kẻ bị bắt đầu tiên thường chỉ là con tốt thí hoặc người bị gài bẫy.

Bạc không thể tự mọc cánh bay. Mười vạn lượng bạc nặng tới hơn ba tấn, muốn vận chuyển cần ít nhất mười cỗ xe ngựa kiên cố và hàng chục tráng đinh.

Hắn được đưa vào một gian phòng thẩm vấn nghiêm trang. Ngồi ở phía trên là hai vị quan viên mặc áo bào quan lại triều đình, vẻ mặt uy nghiêm, ánh mắt lạnh như băng giá.

"Hứa Thất An, thúc phụ ngươi một mực ngậm miệng không khai số bạc kia giấu ở đâu. Ngươi là cháu ruột, thường ngày lén lút tiếp xúc với hắn, có biết đồng bọn của hắn là ai không? Nếu khai ra, triều đình có thể miễn tội chết cho ngươi!"

Viên quan Hình bộ đập mạnh kinh đường mộc xuống bàn.

Hứa Thất An không hề run sợ. Hắn quỳ xuống, ngẩng đầu nhìn thẳng vào hai vị quan lớn, giọng nói trầm tĩnh vang lên:

"Khởi bẩm đại nhân, thúc phụ thảo dân tính tình trung trực, cả đời chỉ biết tu luyện đao pháp, tuyệt đối không có năng lực bày ra đại kế hoán đổi mười vạn lượng bạc ngay dưới mắt bao nhiêu binh sĩ áp giải."

"Hỗn xược! Chứng cớ rành rành, toàn bộ hòm bạc lúc mở ra chỉ có đá cuội, chính tay thúc phụ ngươi phong ấn nắp hòm!"

Hứa Thất An khẽ nhếch môi, ánh mắt lóe lên tia sáng tự tin:

"Đại nhân, nếu thảo dân đoán không lầm, những viên đá cuội trong hòm bạc đều ướt át và có mùi thuốc nổ thoang thoảng đúng không?"

Lời vừa thốt ra, vị Hình bộ quan viên giật mình sững sờ, cây bút lông trên tay suýt chút nữa rơi xuống mặt bàn!`
      },
      {
        id: 'chap-1-3',
        number: 3,
        title: 'Chương 3: Kỳ tích phản chuyển (Chương VIP)',
        publishedAt: '2026-10-03',
        wordCount: 2350,
        isVip: true,
        coinPrice: 10,
        content: `[NỘI DUNG CHƯƠNG VIP ĐÃ ĐƯỢC BẢO VỆ]

Hứa Thất An đứng giữa công đường, từng lời nói như sấm sét đánh thẳng vào tâm can các vị đại thần phụ trách thẩm án.

Hắn giải thích rõ nguyên lý hóa học đơn giản: Natri kim loại tiếp xúc với nước sinh nhiệt bốc cháy, cùng thủ thuật hoán đổi trọng lượng hòm hàng bằng cơ chế đòn bẩy bí mật dưới gầm thuyền áp tải. Bạc chưa bao giờ rời khỏi thuyền vận chuyển của quan phủ, mà đã bị một kẻ nội gián nung chảy và đổ vào thân cột buồm rỗng!

Sau khi đội tuần tra Đả Canh Nhân khai quật cây cột buồm và tìm thấy nguyên vẹn mười vạn lượng bạc, toàn thể triều đình chấn động kinh hoàng. Một tên tiểu tử quân hộ sắp chết chém bỗng chốc trở thành thần thám cứu vãn thể diện quốc gia.

Và chính khoảnh khắc ấy, thủ lĩnh bí ẩn của Đả Canh Nhân – Ngụy Uyên, đã đích thân đến ngục thất để chiêu mộ hắn vào hàng ngũ những kẻ gác đêm của vương triều...`
      }
    ]
  },
  {
    id: 'story-2',
    slug: 'mat-the-trong-sinh-nu-phu-phan-cong',
    title: 'Mạt Thế Trọng Sinh: Nữ Phụ Phản Công',
    author: 'Tô Niệm Dạ Vũ',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    description: 'Kiếp trước, Tô Niệm bị chính người chị em thân thiết và vị hôn phu phản bội, đẩy vào bầy xác sống man rợ để tranh giành không gian ngọc bội gia truyền. Mở mắt ra lần nữa, nàng thấy mình đã trọng sinh về thời điểm ba tháng trước ngày tận thế giáng lâm! Lần này, nàng lập tức kích hoạt không gian thần bí, bán hết cổ phần công ty để trữ hàng ngàn tấn lương thực, vũ khí và xây dựng pháo đài thép bất khả xâm phạm.',
    categories: ['Mạt Thế', 'Trọng Sinh', 'Nữ Cường', 'Tùy Thân Không Gian'],
    status: 'Đang ra',
    views: 980200,
    rating: 4.8,
    ratingCount: 2150,
    chaptersCount: 3,
    updatedAt: '2026-10-11',
    chapters: [
      {
        id: 'chap-2-1',
        number: 1,
        title: 'Chương 1: Trọng sinh ba tháng trước mạt thế',
        publishedAt: '2026-10-05',
        wordCount: 1950,
        isVip: false,
        content: `"A..."

Tô Niệm thở dốc bật dậy khỏi chiếc giường êm ái, mồ hôi ướt đẫm tấm ga lụa tơ tằm cao cấp.

Nàng run rẩy đưa hai tay lên sờ nắn gò má, ngực và bắp chân. Không có vết cắn rách toạc da thịt, không có mùi hôi thối tanh tưởi của bầy tang thi cấp ba, cũng không có cái lạnh thấu xương của cơn bão tuyết ngày tận thế.

Nàng vội vã chộp lấy chiếc điện thoại thông minh đặt trên tủ đầu giường. Màn hình sáng lên với dòng chữ rõ ràng:

[Thứ Hai, ngày 12 tháng 7 năm 2026 - 08:30 sáng]

"Mình... mình thật sự đã trở về rồi sao?!"

Nước mắt lã chã rơi trên má nàng. Ba tháng nữa, đúng vào ngày 12 tháng 10 năm 2026, một trận mưa sao băng đỏ rực như máu sẽ bao trùm toàn cầu. Loại virus bí ẩn từ vũ trụ sẽ khiến 70% nhân loại biến thành xác sống ăn thịt người trong vòng vỏn vẹn hai mươi tư giờ!

Kiếp trước, nàng quá ngây thơ, tin tưởng vào người bạn thân Bạch Uyển Nhi và gã người yêu bội bạc Lục Thành. Nàng chia sẻ từng mẩu bánh mì, che chắn cho họ trước móng vuốt quái vật, để rồi cuối cùng bị chính tay Bạch Uyển Nhi đẩy xuống vách đá làm mồi nhử cho bầy xác sống vây ráp!

Tô Niệm siết chặt nắm tay, móng tay găm sâu vào lòng bàn tay đến mức bật máu. Cơn đau nhức nhắc nhở nàng rằng đây không phải là một giấc mơ.

"Bạch Uyển Nhi, Lục Thành... Món nợ máu kiếp trước, kiếp này Tô Niệm ta sẽ đòi lại cả vốn lẫn lời!"

Nàng bước xuống giường, tiến lại gần bàn trang điểm và lấy ra chiếc hộp gỗ đàn hương cổ kính. Bên trong là một mặt dây chuyền ngọc bích hình giọt lệ tổ tiên để lại.

Nàng không do dự lấy một chiếc kim may, đâm nhẹ vào đầu ngón tay trỏ rồi ấn giọt máu tươi lên bề mặt viên ngọc.

"Ong..."

Một luồng sáng xanh biếc chói lòa bùng nổ, kéo ý thức của nàng rơi vào một thế giới hoàn toàn mới!`
      },
      {
        id: 'chap-2-2',
        number: 2,
        title: 'Chương 2: Không gian thần bí và kế hoạch trữ hàng trăm tỷ',
        publishedAt: '2026-10-06',
        wordCount: 2200,
        isVip: false,
        content: `Khi Tô Niệm mở mắt ra, nàng đang đứng giữa một thảo nguyên xanh tươi bát ngát không thấy điểm dừng.

Không khí nơi đây thanh khiết đến kỳ lạ, từng ngụm thở vào như gột rửa hết mọi mỏi mệt trong cơ thể. Ở trung tâm vùng đất là một hồ nước trong vắt tỏa ra làn sương mờ ảo, bên cạnh là một tòa viện tứ hợp viện cổ kính rộng hàng ngàn mét vuông.

"Đây chính là không gian ngọc bội mà kiếp trước Bạch Uyển Nhi đã cướp đoạt!"

Tô Niệm cúi người vốc một ngụm nước suối uống thử. Nước ngọt mát lan tỏa từ cuống họng xuống dạ dày, toàn thân nàng ấm áp như được ngâm trong suối nước nóng, thị lực và thính giác bỗng chốc trở nên nhạy bén gấp bội.

Đây là Linh Tuyền! Nước suối có thể thanh lọc độc tố cơ thể, tăng cường thể chất và đặc biệt là có khả năng ức chế kháng thể virus tang thi giai đoạn đầu!

Nàng bước vào trong viện kiểm tra. Kho lương thực bên trong có tính năng ngưng đọng thời gian: Đồ ăn nóng hổi đặt vào đây, mười năm sau lấy ra vẫn bốc khói nghi ngút như lúc ban đầu!

"Tuyệt vời! Thời gian của mình chỉ có đúng 90 ngày!"

Tô Niệm lập tức rời khỏi không gian, quay trở lại phòng ngủ hiện thực. Nàng mở máy tính, liệt kê danh sách tài sản hiện có:

1. Thừa kế 15% cổ phần tập đoàn Tô Thị do cha mẹ để lại, trị giá ước tính khoảng 800 tỷ đồng.
2. Ba căn biệt thự ven biển và một khu căn hộ cao cấp tại trung tâm thành phố.
3. Tiền mặt trong tài khoản ngân hàng: hơn 50 tỷ đồng.

Trong ngày tận thế sắp tới, tiền giấy và cổ phiếu sẽ biến thành giấy vụn không hơn không kém. Chỉ có lương thực, nước sạch, thuốc men và vũ khí mới là chân lý sống còn!

Nàng lập tức nhấc máy gọi cho công ty môi giới tài chính lớn nhất thành phố:

"Alo, tôi muốn thanh lý toàn bộ cổ phần và bất động sản dưới tên tôi trong vòng một tuần, chấp nhận chiết khấu 15% để nhận tiền mặt ngay lập tức!"`
      },
      {
        id: 'chap-2-3',
        number: 3,
        title: 'Chương 3: Càn quét kho hàng nông sản (Chương VIP)',
        publishedAt: '2026-10-07',
        wordCount: 2400,
        isVip: true,
        coinPrice: 10,
        content: `[NỘI DUNG CHƯƠNG VIP ĐÃ ĐƯỢC BẢO VỆ]

Với số tiền mặt khổng lồ gần một ngàn tỷ đồng vừa giải ngân, Tô Niệm bắt đầu chiến dịch mua sắm điên cuồng nhất lịch sử.

Nàng bay thẳng tới miền Tây, bao trọn toàn bộ năm kho gạo xuất khẩu lớn nhất với hơn mười ngàn tấn gạo thơm Jasmine và nếp cái hoa vàng. Tiếp đó, nàng đặt hàng trực tiếp từ các nhà máy sản xuất thực phẩm đóng hộp: nửa triệu hộp thịt bò hầm, xúc xích, mì tôm, đồ ăn năng lượng cao và sữa bột nguyên kem.

Không dừng lại ở đó, nàng liên hệ với một tổ chức an ninh tư nhân tại biên giới để bí mật đặt làm hàng rào thép gai chống cắt, máy phát điện năng lượng mặt trời công suất lớn và hàng trăm gallon nhiên liệu dự trữ...`
      }
    ]
  },
  {
    id: 'story-3',
    slug: 'toan-tri-doc-gia-chu-than',
    title: 'Toàn Trí Độc Giả: Chư Thần Trở Lại',
    author: 'Sing Shong',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
    description: 'Kim Độc Hành là một nhân viên văn phòng bình thường, sở thích duy nhất của anh là đọc bộ tiểu thuyết mạng dài ba ngàn chương "Ba Cách Để Sống Sót Trong Thế Giới Đổ Nát". Vào đúng ngày anh đọc xong chương cuối cùng cũng là lúc thế giới thực sụp đổ, các chòm sao cổ đại giáng lâm và toàn bộ kịch bản của cuốn tiểu thuyết trở thành hiện thực đẫm máu. Là độc giả duy nhất biết trước toàn bộ kết cục, anh bắt đầu hành trình nghịch thiên cải mệnh.',
    categories: ['Đô Thị', 'Huyền Bí', 'Vô Hạn Lưu', 'Dị Năng'],
    status: 'Đang ra',
    views: 754000,
    rating: 4.95,
    ratingCount: 1940,
    chaptersCount: 3,
    updatedAt: '2026-10-12',
    chapters: [
      {
        id: 'chap-3-1',
        number: 1,
        title: 'Chương 1: Kịch bản bắt đầu',
        publishedAt: '2026-10-08',
        wordCount: 1780,
        isVip: false,
        content: `Trên chuyến tàu điện ngầm tuyến số 3 đang lao vun vút trong đường hầm tối tăm, Kim Độc Hành nhìn chằm chằm vào màn hình điện thoại.

[Bạn đã đọc đến chương 3149 - Chương cuối cùng: Ba Cách Để Sống Sót Trong Thế Giới Đổ Nát.]

Mười năm ròng rã. Cuốn tiểu thuyết kéo dài suốt mười năm thanh xuân của anh cuối cùng cũng khép lại. Trong mười năm đó, từ hàng ngàn độc giả lúc ban đầu rơi rụng dần, cho đến chương cuối cùng này, lượt xem hiển thị duy nhất chỉ là số 1.

Đúng vậy, anh chính là độc giả duy nhất kiên trì đồng hành cùng tác giả đến tận phút chót.

Một dòng tin nhắn bất ngờ xuất hiện từ tác giả:

"Cảm ơn bạn đã luôn ở đây suốt mười năm qua. Nhờ có bạn, câu chuyện này mới có thể đi đến hồi kết. Món quà đặc biệt dành riêng cho độc giả duy nhất sẽ được kích hoạt vào đúng 7 giờ tối hôm nay. Chúc bạn may mắn trong kịch bản mới."

Kim Độc Hành mỉm cười khó hiểu: "Tác giả hài hước thật đấy, kịch bản gì chứ..."

Anh liếc nhìn đồng hồ đeo tay:

[18:59:58]
[18:59:59]
[19:00:00]

"Kéttt——!"

Đoàn tàu điện ngầm bất ngờ phanh gấp dữ dội khiến tất cả hành khách ngã dúi dụi về phía trước. Toàn bộ ánh đèn trong toa tàu phụt tắt, chìm vào bóng tối đặc quánh rợn người!

"Chuyện gì thế này? Mất điện à?"
"Lái tàu làm ăn kiểu gì thế!"

Tiếng la hét phàn nàn của đám đông vang lên ầm ĩ. Nhưng ngay giây tiếp theo, không gian bỗng rung chuyển dữ dội, một luồng ánh sáng xanh lam ma quái bốc lên giữa khoảng không của toa tàu.

Một sinh vật nhỏ bé với cặp sừng xoắn ốc và đôi mắt đỏ ngầu lơ lửng trên không trung, khóe miệng hé lộ nụ cười tàn nhẫn:

[Xin chào các giống loài hạ đẳng. Kịch bản sinh tồn chính thức bắt đầu!]`
      },
      {
        id: 'chap-3-2',
        number: 2,
        title: 'Chương 2: Lựa chọn của chòm sao',
        publishedAt: '2026-10-09',
        wordCount: 2050,
        isVip: false,
        content: `Một cửa sổ trạng thái ảo màu xanh lơ hiện ra trước mắt toàn bộ hành khách trong toa tàu:

[Kịch Bản Chính Tuyến #1: Chứng Minh Giá Trị Sinh Tồn]
- Độ khó: F
- Thời hạn: 30 phút
- Mục tiêu: Giết chết ít nhất một sinh vật sống để chứng minh quyền được tồn tại.
- Thất bại: Xóa sổ toàn bộ!

Sự hoảng loạn bùng nổ đến đỉnh điểm khi một hành khách to tiếng chống đối bị sinh vật đầu sừng búng tay khiến đầu nổ tung thành một vũng máu tươi!

"Aaaa! Giết người rồi!"
"Cứu mạng! Mở cửa ra!"

Những ánh mắt bắt đầu nhìn nhau với sự cảnh giác và tàn độc. Trong không gian chật hẹp của toa tàu, con người bắt đầu lao vào xâu xé lẫn nhau như loài dã thú để tìm đường sống.

Kim Độc Hành đứng nép mình trong góc, nhịp tim đập đều đặn đến đáng kinh ngạc. Anh đã đọc đoạn này không dưới mười lần trong cuốn tiểu thuyết!

"Mục tiêu là 'giết chết một sinh vật sống', chứ không hề bắt buộc phải là con người!"

Anh nhanh chóng nhìn sang cậu bé ngồi ở hàng ghế đối diện. Trên tay cậu bé là một chiếc hộp nhựa đựng dế mèn và cào cào vừa bắt ở công viên buổi chiều...`
      },
      {
        id: 'chap-3-3',
        number: 3,
        title: 'Chương 3: Thu phục thần thú côn trùng (Chương VIP)',
        publishedAt: '2026-10-10',
        wordCount: 2150,
        isVip: true,
        coinPrice: 10,
        content: `[NỘI DUNG CHƯƠNG VIP ĐÃ ĐƯỢC BẢO VỆ]

Kim Độc Hành nhẹ nhàng xin hộp côn trùng từ cậu bé, mở nắp và bóp chết một chú cào cào.

[Ting! Bạn đã tiêu diệt sinh mệnh đầu tiên.]
[Kịch bản chính tuyến #1 hoàn thành sớm nhất phân khu!]
[Các Chòm Sao cổ đại đang theo dõi hành động khác thường của bạn.]
- [Chòm sao 'Hắc Hỏa Long Trong Vực Thẳm' cảm thấy thích thú với sự mưu mẹo của bạn.]
- [Chòm sao 'Mưu Lược Gia Bất Bại' đang đánh giá trí tuệ của bạn.]
- [Bạn nhận được 1000 Xu Thưởng từ kênh phát sóng!]

Trong khi những người khác còn đang nhuốm máu đồng loại, Kim Độc Hành đã sở hữu số điểm tích lũy đầu tiên và mở khóa kho kỹ năng độc quyền mà chỉ độc giả duy nhất mới biết cách kích hoạt...`
      }
    ]
  },
  {
    id: 'story-xuyen-vao-hanh-tinh-rac',
    slug: 'xuyen-vao-hanh-tinh-rac-thanh-bac-thay-che-tao-co-giap-tu-dong-phe-lieu',
    title: 'Xuyên Vào Hành Tinh Rác: Thành Bậc Thầy Chế Tạo Cơ Giáp Từ Đống Phế Liệu',
    author: 'Nhất Diệp Vô Hoa',
    coverUrl: 'https://cdn.bientruyen.com/images/covers/1791018601223-3tso0g2nosm.webp',
    description: 'Đường Điềm Điềm sau một vụ nổ bất ngờ xuyên không đến một hành tinh rác lạnh giá ở thời đại tinh tế tương lai. Cơ thể yếu ớt, môi trường khắc nghiệt, nước và thức ăn khan hiếm, cô phải bắt đầu cuộc sống bằng việc bới từng đống phế liệu để sinh tồn. Thế nhưng, cô bất ngờ kích hoạt năng lực đặc biệt có thể phân giải, tinh luyện và thấu suốt mọi cấu trúc vật liệu kim loại, kết hợp cùng siêu trí não Tiểu Trí đến từ nền văn minh cao cấp. Từ việc nhặt từng con ốc vít, linh kiện hỏng hóc, cô tháo dỡ, sửa chữa quang não, rồi chế tạo nên những khối động cơ và bộ giáp cơ giáp đỉnh phong chấn động cả vũ trụ!',
    categories: ['Khoa học viễn tưởng', 'Tinh Tế', 'Cơ Giáp', 'Xuyên Không', 'Phế Thổ', 'Nữ Cường', 'Sảng Văn'],
    status: 'Hoàn thành',
    views: 892400,
    rating: 4.95,
    ratingCount: 2180,
    chaptersCount: 337,
    updatedAt: '2026-10-21',
    chapters: [
      {
        id: 'chap-xt-1',
        number: 1,
        title: 'Chương 1: Mở mắt trên bãi phế liệu tinh tế',
        publishedAt: '2026-10-12',
        wordCount: 2290,
        isVip: false,
        content: `Đường Điềm Điềm chỉ cảm thấy đầu đau như muốn nứt ra, ký ức cuối cùng dừng lại ở một tiếng nổ lớn, khói đặc xộc vào mũi, lưỡi lửa từ ngoài cửa sổ đã cháy lan vào, trong chớp mắt nuốt trọn cả căn phòng. Cô trốn trong phòng tắm, dội ướt toàn thân, dùng khăn ướt bịt mũi miệng, chờ đợi một cuộc cứu viện xa vời. Nhưng cô đã quên mất, bên cạnh phòng tắm là một căn bếp nhỏ, trong bếp còn một bình gas chưa dùng hết. Tiếng nổ dữ dội liên tiếp làm căn nhà cũ kỹ rung chuyển.

Tường nứt toác, ống nước vỡ tung. Cô trốn trong căn phòng tắm chật hẹp, căn bản không thể tránh khỏi bức tường đổ sập và áp lực nước phun ra. Một tiếng “ầm” vang lên, cô chỉ cảm thấy đỉnh đầu đau nhói, rồi hoàn toàn mất đi ý thức.

Đường Điềm Điềm thở hổn hển ngồi bật dậy khỏi chiếc giường nhỏ hẹp, vì dùng sức quá mạnh, chiếc giường ọp ẹp được kê tạm phát ra tiếng kẽo kẹt chói tai, trong đêm tối yên tĩnh lại càng rõ ràng, nhanh chóng lan ra xa. Người đang ngủ say bị đánh thức khẽ chửi một câu, trở mình rồi ngủ tiếp như chết.

Lau vệt mồ hôi không hề tồn tại trên trán, một lúc lâu sau hơi thở cô mới ổn định lại. Cô không khỏi ôm lấy hai đầu gối, vùi đầu vào đó. Sao lại mơ thấy giấc mơ này nữa rồi? Không hiểu sao dạo này cô cứ mơ thấy chuyện trước khi xuyên không, khiến lòng cô bất an, luôn cảm thấy có chuyện gì đó không lành sắp xảy ra.

Khả năng thích nghi của cô vốn rất mạnh, trước đây cũng không ít lần đọc loại truyện này. Sau khi biết mình xuyên không, cô cũng chưa từng nghĩ đến việc quay về, dù sao kiếp trước cũng chẳng có gì đáng lưu luyến.

Vì ban đêm ngủ không ngon, ban ngày liền không có tinh thần, nên cô đã liên tục một tuần không nhặt được rác nào đáng giá. Mấy ngày nay cô đều sống nhờ điểm tín dụng tích góp trước kia. Nếu còn không tìm được thứ gì đáng tiền, tiếp theo cô sẽ phải thắt lưng buộc bụng mà sống, thậm chí có thể phải đối phó với lũ chuột đất đáng ghét kia.

Nghĩ đến đây, Đường Điềm Điềm không khỏi nhíu mày. Nếu cứ tiếp tục như vậy, thật sự sẽ hình thành một vòng luẩn quẩn, trong môi trường khắc nghiệt thế này, sớm muộn gì cũng có ngày mất mạng. Đến thế giới này bốn năm, đây là lần thứ ba cô có cảm giác nguy hiểm như vậy, trong tình huống chưa gặp phải sinh vật biến dị.

Thể chất của cơ thể này không tốt lắm, tất nhiên không phải so với kiếp trước, mà là so với tiêu chuẩn của môi trường và thời không này.

Hành tinh cô đang ở là một hành tinh rác, bầu trời quanh năm xám xịt, ngẩng đầu nhìn lâu lại càng thêm ngột ngạt. Từng ngọn núi rác nối tiếp nhau chồng chất, nhìn thì có vẻ hùng vĩ, chỉ tiếc là không thể ở được.

Nước và thực vật trên hành tinh rác vô cùng ít ỏi, đều nằm trong tay những thế lực lớn ở địa phương. Người sống trên đây đều vô cùng gian nan, chỉ có thể dựa vào rác có giá trị nhặt được để đổi lấy điểm tín dụng hoặc thức ăn, nước uống từ những thương nhân đến hành tinh rác thu mua.

Nghĩ đến đây, Đường Điềm Điềm không khỏi sờ sợi dây trước cổ, kéo ra một mặt dây chuyền gỗ hình quả đào dẹt. Thứ này rất bình thường, không có giá trị gì, căn bản không ai thèm nhìn nó một cái. Lúc đầu cô cũng nghĩ vậy, sau đó đeo nó là vì phát hiện ở mặt sau có một lỗ tròn, bên trong giấu một nút không gian. Cô vẫn nhớ như in vẻ mặt mình khi đó như bị sét đánh, cũng vì thế mà càng thêm cẩn thận. Ở nơi này, đồ tốt đều không giữ được, trừ khi có thực lực. Mà mặt dây chuyền gỗ này, lại trở thành lớp ngụy trang tốt nhất.

Tuy nút không gian không lớn lắm, khoảng bảy tám mét khối, không đựng được máy móc cỡ lớn, nhưng mấy năm qua cô cũng đã cất không ít đồ vào đó. Trong đó, nhiều nhất là hộp năng lượng, cùng một ít kim loại khá đáng giá nhưng số lượng rất ít, cô định tích đủ số lượng rồi mới đổi lấy điểm tín dụng.

Cẩn thận lấy những kim loại đó ra. Tuy rất tối, nhưng sau mấy năm rèn luyện, cô dần dần có thể nhìn rõ đường nét của đồ vật trong bóng tối.

Cầm kim loại trong tay, đây là một khối kim loại màu trắng bạc dài khoảng một đốt ngón tay, sờ vào mát lạnh, thuộc hệ men gốm bạch kim, là một loại kim loại cực kỳ hiếm, nghe nói thường dùng trên giáp cơ cao cấp. Không hiểu sao lại rơi một đoạn nhỏ vào đống rác, đúng là lợi cho cô.

Men gốm bạch kim này là thứ đáng giá nhất và cũng là thứ cô thích nhất trong tất cả bộ sưu tập của mình. Vì vậy, mỗi khi tâm trạng không tốt hoặc gặp ác mộng, cô đều thích lấy ra sờ vài cái. Nhưng đêm nay, vừa nắm nó trong tay, Đường Điềm Điềm đã rất nhạy bén nhận ra sự khác biệt.`
      },
      {
        id: 'chap-xt-2',
        number: 2,
        title: 'Chương 2: Căn cứ bí mật dưới khoang tàu đắm',
        publishedAt: '2026-10-12',
        wordCount: 2288,
        isVip: false,
        content: `Cô bê mấy tấm thép nặng trịch sang một bên, cẩn thận đặt xuống sau lưng, để lộ ra một cái hang tối om. Điềm Điềm nhìn kỹ một lát, rồi mới lấy đèn năng lượng từ trong nút không gian ra, xem thử lượng năng lượng còn lại, ước chừng thời gian dùng được, sau đó mới dè dặt men theo cái hang đi xuống.

Đây là nơi cô phát hiện từ lâu lắm rồi, nói chính xác thì là khoang thuyền của một con tàu vũ trụ nát bét. Sau hơn ba năm dọn dẹp, cô đã khai thông được một khoảng không rộng chừng ba mươi mét vuông, cỡ một căn phòng.

Việc này tốn nhiều thời gian như vậy, chủ yếu là vì cô sợ mình ra vào đây thường xuyên sẽ khiến người khác chú ý. Dù bình thường chẳng mấy ai để tâm đến cô bé da đen nhẻm, tóc tai bù xù, cười lên vừa ngố vừa xấu, lần nào thu hoạch cũng chẳng được bao nhiêu này.

Đây là căn cứ bí mật của cô. Phần lớn những thứ to to, hơi có giá trị nhặt được đều được cô giấu ở đây, rồi thỉnh thoảng giả vờ gặp may mắn mang ra đổi lấy thức ăn, nước uống và đồ dùng thiết yếu. Cũng vì khu cư trú của Điềm Điềm khá yên ổn, chuyện cướp bóc gần như rất hiếm khi xảy ra, nên cô mới dám làm như vậy.

Đi xuống một cầu thang xoắn ốc, rồi đạp lên những chỗ nhô ra quanh hang, cẩn thận nhảy xuống đáy mà không bị cào xước. Ba năm luyện tập như thế khiến thân thể cô mềm dẻo hơn nhiều, thể chất cũng khá hơn chút, nhưng so với người khác thì vẫn quá yếu.

Ở một góc phòng, có mấy thứ kim loại hình dáng kỳ quái được đặt hơi lộn xộn: nào là miếng bảo vệ đầu gối của giáp cơ, nào là một thứ gì đó giống kính nhòm, thứ lớn nhất là một cánh tay giáp cơ. Còn lại đều là những thứ cô tháo ra từ các đồ vật khác và cho là có chút giá trị.

Điềm Điềm biết rõ, thứ cô thấy quý giá chưa chắc đã đáng gì trong mắt người khác. Đó chính là khoảng cách về thực lực. Người khác có thể đi đến những nơi xa khu cư trú hơn, còn cô thì chỉ có thể tìm gần. Nhưng gần đây gần như bị người ta lục soát hết rồi, còn đâu phần cho cô nữa, nên cô đành phải đào sâu xuống. Không ngờ cũng thật sự kiếm được không ít đồ tốt.`
      },
      {
        id: 'chap-xt-3',
        number: 3,
        title: 'Chương 3: Bàn tay vàng thức tỉnh - Thấu thị vật liệu',
        publishedAt: '2026-10-12',
        wordCount: 1624,
        isVip: false,
        content: `Trong lòng thầm niệm "Loại bỏ phi vật liệu trong quang não, loại bỏ phi vật liệu trong quang não...", mấy lần đầu không có hiệu quả, nhưng Điềm Điềm lại không dừng lại. Cô cảm thấy mình như bước vào một trạng thái kỳ diệu, dường như chỉ cần đi theo cảm giác này, cô sẽ có được những thứ mình chưa từng tưởng tượng, nhìn thấy một thế giới khác biệt, độc nhất vô nhị.

Thời gian dần trôi, Điềm Điềm vẫn chìm đắm trong cảm giác kỳ lạ ấy, toàn thân ấm áp, đầu óc tỉnh táo chưa từng thấy, mọi ký ức bỗng trở nên rõ ràng, kể cả kiếp trước, nhưng đó chỉ là một phần nhỏ. Điều quan trọng nhất là cảm giác này như đang dẫn dắt cô.

Cô vừa phát hiện ra năng lực này, thực ra cũng không biết nó xuất hiện thế nào. Nếu nói là phúc lợi khi xuyên không, sao lại bốn năm sau mới có? Nhưng nếu không giải thích như vậy, lại chẳng thể nói ra manh mối gì. Điềm Điềm chưa bao giờ nghĩ vận may của mình tốt, lần duy nhất có lẽ là sau khi chết được xuyên không và có cơ hội sống lại, còn những mặt khác thì thật sự không có.

Nhưng bất kể năng lực này xuất hiện thế nào, chỉ cần nó không biến mất là được. Theo ý nghĩ đó của Điềm Điềm, dòng nước ấm đang chảy khắp cơ thể dường như khựng lại một chút, rồi một bộ phận nào đó đột nhiên trở nên nóng rực, từ từ lan ra toàn thân. Điềm Điềm cảm thấy như mình đang ở trong biển lửa, rất nóng và đau, nhưng cô không thể cử động, ký ức đáng sợ lại bắt đầu cuồn cuộn ùa về.

Điềm Điềm không biết đã bao lâu, chỉ cảm thấy trong đầu đau nhói, rồi cơn đau nóng rực khắp người biến mất, thay vào đó là cảm giác mát lạnh, vô cùng dễ chịu, suýt nữa thì rên lên.

Nhưng cô nhanh chóng kìm lại, vì phát hiện trong đầu xuất hiện một luồng thông tin xa lạ, hình như về năng lực của cô, chủ yếu dùng cho các loại vật liệu, bao gồm các loại kim loại, với các chức năng chính như thăm dò, phân tích, trích xuất, dung hợp, kết nối, phân giải, tinh luyện... Chỉ cần đủ tinh thần lực, cô hoàn toàn có thể sử dụng năng lực của mình một cách đầy đủ!`
      },
      {
        id: 'chap-xt-4',
        number: 4,
        title: 'Chương 4: Kích hoạt siêu trí não Tiểu Trí',
        publishedAt: '2026-10-12',
        wordCount: 1850,
        isVip: false,
        content: `Điềm Điềm cảm thấy chắc chắn tai mình nghe nhầm rồi, nếu không sao cô lại nghe thấy cái gì mà hệ thống trưởng thành cho trẻ nhỏ chứ. Tuy được gọi là chủ nhân cũng khá thích, nhưng vẫn hơi băn khoăn. Nhìn cậu bé dễ thương mặt lạnh tanh trên màn hình, Điềm Điềm dè dặt hỏi: "Xin hỏi một chút, vừa nãy ngươi nói gì cơ?"

"Trẻ con đúng là phiền phức, câu đơn giản vậy mà cũng không hiểu." Cậu bé bĩu môi nói, "Đương nhiên rồi, chủ nhân, ngươi có thể gọi ta là Tiểu Trí. Ta là trí não của quang não này. Đây là hệ thống học tập trưởng thành cho trẻ nhỏ thế hệ thứ ba của nền văn minh Hankeloras, chuyên cung cấp học tập toàn diện cho trẻ nhỏ, quyết tâm bồi dưỡng trẻ nhỏ thành nhân tài toàn diện. Vậy nên chủ nhân, cứ yên tâm giao bản thân cho ta, ta nhất định sẽ bồi dưỡng ngươi thành tài."

Nghe thấy hai chữ "trẻ con", mặt Điềm Điềm liền đen lại, nhưng vừa nghe đến cái hệ thống học tập kia, cô lập tức mây tan trời sáng. Đúng là cầu gì được nấy, hệ thống học tập này chẳng phải được chuẩn bị riêng cho cô sao?

"Ý ngươi là, ta có thể dùng hệ thống học tập này?" Điềm Điềm nén sự phấn khích trong lòng, hỏi.

"Đúng vậy, ngươi đã liên kết rồi, ngoài ngươi ra không ai dùng được." Tiểu Trí thấy chỉ số thông minh của chủ nhân mới này khá thấp, haiz, chủ nhân đầu tiên đúng là quá ham mới chán cũ, dù không cần hắn nữa cũng phải tìm cho hắn một chủ nhân mới chứ.

"Vậy được, Tiểu Trí, mau nói cho ta biết tình hình chung về lịch sử, địa lý của thế giới này đi."

"Ta nói này chủ nhân, ngươi đang ở đâu vậy, ta đến một chút tín hiệu mạng cũng không tìm thấy."

"Ta đang ở hành tinh rác."

"Hành tinh rác gì? Nền văn minh Hankeloras từ bao giờ có hành tinh rác?" Tiểu Trí nhíu đôi lông mày xinh xắn, nghi hoặc hỏi. Cậu bé trợn mắt rồi bĩu môi khóc thảm thiết, bắt đầu chuỗi ngày đồng hành dở khóc dở cười giữa một cô bé nhặt rác và một siêu trí não cổ đại!`
      },
      {
        id: 'chap-xt-5',
        number: 5,
        title: 'Chương 5: Bắt tay tái chế và nâng cấp linh kiện',
        publishedAt: '2026-10-12',
        wordCount: 1950,
        isVip: false,
        content: `Sau khi Tiểu Trí đồng ý đào tạo, Đường Điềm Điềm lập tức lên kế hoạch tập trung rèn luyện tinh thần lực và tận dụng triệt để dị năng thấu thị vật liệu.

Dưới sự chỉ dẫn khắt khe của Tiểu Trí, Điềm Điềm bắt đầu tháo dỡ từng mảnh hợp kim cũ, loại bỏ tạp chất và tinh chế lại những thanh kim loại cấp A hiếm có. Bằng sự kiên trì phi thường và đôi bàn tay khéo léo, cô từng bước biến những mảnh phế thải thành các linh kiện cơ giáp tinh xảo đạt độ chuẩn xác tuyệt đối.

Một tương lai mới rực rỡ đã bắt đầu hé mở ngay từ góc nhỏ dưới bãi rác lạnh giá!`
      },
      { id: 'chap-xt-6', number: 6, title: 'Chương 6: Thăm dò lòng đất phế tích', publishedAt: '2026-10-12', wordCount: 1820, isVip: false },
      { id: 'chap-xt-7', number: 7, title: 'Chương 7: Nút không gian và bí mật men gốm', publishedAt: '2026-10-12', wordCount: 1940, isVip: false },
      { id: 'chap-xt-8', number: 8, title: 'Chương 8: Trao đổi tại chợ đen', publishedAt: '2026-10-12', wordCount: 2050, isVip: false },
      { id: 'chap-xt-9', number: 9, title: 'Chương 9: Cuộc hội ngộ bất ngờ', publishedAt: '2026-10-12', wordCount: 1780, isVip: false },
      { id: 'chap-xt-10', number: 10, title: 'Chương 10: Sửa chữa thiết bị liên lạc', publishedAt: '2026-10-12', wordCount: 1910, isVip: false },
      { id: 'chap-xt-11', number: 11, title: 'Chương 11: Nguy hiểm rình rập', publishedAt: '2026-10-12', wordCount: 1860, isVip: false },
      { id: 'chap-xt-12', number: 12, title: 'Chương 12: Thức tỉnh tinh thần lực cấp cao', publishedAt: '2026-10-12', wordCount: 2100, isVip: false },
      { id: 'chap-xt-13', number: 13, title: 'Chương 13: Đột phá thể phách', publishedAt: '2026-10-12', wordCount: 1970, isVip: false },
      { id: 'chap-xt-14', number: 14, title: 'Chương 14: Kẻ thù tìm đến', publishedAt: '2026-10-12', wordCount: 1890, isVip: false },
      { id: 'chap-xt-15', number: 15, title: 'Chương 15: Kế hoạch phản công', publishedAt: '2026-10-12', wordCount: 2020, isVip: false },
      { id: 'chap-xt-16', number: 16, title: 'Chương 16: Trận chiến trong đêm tuyết', publishedAt: '2026-10-12', wordCount: 2150, isVip: false },
      { id: 'chap-xt-17', number: 17, title: 'Chương 17: Thu dọn chiến trường', publishedAt: '2026-10-12', wordCount: 1840, isVip: false },
      { id: 'chap-xt-18', number: 18, title: 'Chương 18: Gặp gỡ thợ máy Trần Hưng', publishedAt: '2026-10-12', wordCount: 2210, isVip: false },
      { id: 'chap-xt-19', number: 19, title: 'Chương 19: Bái sư học nghệ', publishedAt: '2026-10-12', wordCount: 1960, isVip: false },
      { id: 'chap-xt-20', number: 20, title: 'Chương 20: Thử thách của Trần Hưng', publishedAt: '2026-10-12', wordCount: 2080, isVip: false },
      { id: 'chap-xt-21', number: 21, title: 'Chương 21: Hoàn thành bài kiểm tra', publishedAt: '2026-10-12', wordCount: 1930, isVip: false },
      { id: 'chap-xt-22', number: 22, title: 'Chương 22: Nhận diện quặng Carat', publishedAt: '2026-10-12', wordCount: 1870, isVip: false },
      { id: 'chap-xt-23', number: 23, title: 'Chương 23: Tinh chế men tinh kim', publishedAt: '2026-10-12', wordCount: 2010, isVip: false },
      { id: 'chap-xt-24', number: 24, title: 'Chương 24: Cơ giáp phòng thủ sơ khai', publishedAt: '2026-10-12', wordCount: 2130, isVip: false },
      { id: 'chap-xt-25', number: 25, title: 'Chương 25: Động cơ phản lực bị giấu kín', publishedAt: '2026-10-12', wordCount: 1990, isVip: false },
      { id: 'chap-xt-26', number: 26, title: 'Chương 26: Âm mưu của thương đoàn', publishedAt: '2026-10-12', wordCount: 2060, isVip: false },
      { id: 'chap-xt-27', number: 27, title: 'Chương 27: Chuẩn bị rời khỏi hành tinh rác', publishedAt: '2026-10-12', wordCount: 2120, isVip: false },
      { id: 'chap-xt-28', number: 28, title: 'Chương 28: Nhận nuôi và hiệp ước rời đi', publishedAt: '2026-10-12', wordCount: 2260, isVip: false },
      { id: 'chap-xt-29', number: 29, title: 'Chương 29: Phi thuyền cất cánh', publishedAt: '2026-10-12', wordCount: 1990, isVip: false },
      { id: 'chap-xt-30', number: 30, title: 'Chương 30: Hậu quả và truy lùng', publishedAt: '2026-10-12', wordCount: 2040, isVip: false },
      { id: 'chap-xt-31', number: 31, title: 'Chương 31: Trên hành tinh tiếp tế', publishedAt: '2026-10-20', wordCount: 2150, isVip: false },
      { id: 'chap-xt-32', number: 32, title: 'Chương 32: Hiểu rõ tình hình', publishedAt: '2026-10-20', wordCount: 1980, isVip: false },
      { id: 'chap-xt-33', number: 33, title: 'Chương 33: Ráng lên nhóc con', publishedAt: '2026-10-20', wordCount: 2050, isVip: false },
      { id: 'chap-xt-34', number: 34, title: 'Chương 34: Đến Lan Tháp tinh', publishedAt: '2026-10-20', wordCount: 2180, isVip: false },
      { id: 'chap-xt-35', number: 35, title: 'Chương 35: Phải học nhiều thứ quá', publishedAt: '2026-10-20', wordCount: 2020, isVip: false },
      { id: 'chap-xt-36', number: 36, title: 'Chương 36: Biến cố bất ngờ', publishedAt: '2026-10-20', wordCount: 1950, isVip: false },
      { id: 'chap-xt-37', number: 37, title: 'Chương 37: Nơi ở mới', publishedAt: '2026-10-20', wordCount: 2070, isVip: false },
      { id: 'chap-xt-38', number: 38, title: 'Chương 38: Vấn đề của Tiểu Băng', publishedAt: '2026-10-20', wordCount: 2110, isVip: false },
      { id: 'chap-xt-39', number: 39, title: 'Chương 39: Ngửa bài', publishedAt: '2026-10-20', wordCount: 2030, isVip: false },
      { id: 'chap-xt-40', number: 40, title: 'Chương 40: Chuẩn bị trước rồi tính', publishedAt: '2026-10-20', wordCount: 2140, isVip: false },
      { id: 'chap-xt-41', number: 41, title: 'Chương 41: Thi cử', publishedAt: '2026-10-20', wordCount: 2080, isVip: false },
      { id: 'chap-xt-42', number: 42, title: 'Chương 42: Vượt qua kỳ thi', publishedAt: '2026-10-20', wordCount: 2190, isVip: false },
      { id: 'chap-xt-43', number: 43, title: 'Chương 43: Nhiệm vụ sửa chữa', publishedAt: '2026-10-20', wordCount: 1960, isVip: false },
      { id: 'chap-xt-44', number: 44, title: 'Chương 44: Hộp năng lượng', publishedAt: '2026-10-20', wordCount: 2120, isVip: false },
      { id: 'chap-xt-45', number: 45, title: 'Chương 45: Cắm đầu nghiên cứu', publishedAt: '2026-10-20', wordCount: 2060, isVip: false },
      { id: 'chap-xt-46', number: 46, title: 'Chương 46: Cuối cùng cũng có tiền', publishedAt: '2026-10-20', wordCount: 2170, isVip: false },
      { id: 'chap-xt-47', number: 47, title: 'Chương 47: Có tiền thì mua sắm', publishedAt: '2026-10-20', wordCount: 2040, isVip: false },
      { id: 'chap-xt-48', number: 48, title: 'Chương 48: Bị bắt cóc, xui xẻo thật', publishedAt: '2026-10-20', wordCount: 2090, isVip: false },
      { id: 'chap-xt-49', number: 49, title: 'Chương 49: Rốt cuộc muốn thứ gì?', publishedAt: '2026-10-20', wordCount: 1980, isVip: false },
      { id: 'chap-xt-50', number: 50, title: 'Chương 50: Phân tích', publishedAt: '2026-10-20', wordCount: 2150, isVip: false },
      { id: 'chap-xt-51', number: 51, title: 'Chương 51: Trốn thoát', publishedAt: '2026-10-20', wordCount: 2130, isVip: false },
      { id: 'chap-xt-52', number: 52, title: 'Chương 52: Quán rượu thợ săn', publishedAt: '2026-10-20', wordCount: 2010, isVip: false },
      { id: 'chap-xt-53', number: 53, title: 'Chương 53: Khảo hạch quân đội', publishedAt: '2026-10-20', wordCount: 2240, isVip: false },
      { id: 'chap-xt-54', number: 54, title: 'Chương 54: Nhiệm vụ thăng cấp', publishedAt: '2026-10-20', wordCount: 2180, isVip: false },
      { id: 'chap-xt-55', number: 55, title: 'Chương 55: Phái đi hiệp trợ', publishedAt: '2026-10-20', wordCount: 2070, isVip: false },
      { id: 'chap-xt-56', number: 56, title: 'Chương 56: Ngày đầu tiên trên chiến hạm', publishedAt: '2026-10-20', wordCount: 2110, isVip: false },
      { id: 'chap-xt-57', number: 57, title: 'Chương 57: Huấn luyện cường độ cao', publishedAt: '2026-10-20', wordCount: 2160, isVip: false },
      { id: 'chap-xt-58', number: 58, title: 'Chương 58: Lần đầu tiêu diệt dị trùng', publishedAt: '2026-10-20', wordCount: 2200, isVip: false },
      { id: 'chap-xt-59', number: 59, title: 'Chương 59: Suy đoán', publishedAt: '2026-10-20', wordCount: 2080, isVip: false },
      { id: 'chap-xt-60', number: 60, title: 'Chương 60: Chân tướng nguyên nhân', publishedAt: '2026-10-20', wordCount: 2230, isVip: false }
    ]
  }
];

// Cơ chế CHỐNG TRÙNG TRUYỆN: Duyệt theo Slug và Tên chuẩn hóa
const storyMap = new Map<string, Story>();

// ƯU TIÊN 1: Nạp truyện mặc định trước (dữ liệu chọn lọc chất lượng cao, có đầy đủ nội dung)
DEFAULT_STORIES.forEach(s => {
  if (s && s.slug) {
    storyMap.set(s.slug, s);
  }
});

// ƯU TIÊN 2: Bổ sung truyện từ metadata nếu chưa có trong danh sách mặc định
((storiesMetadataData || []) as unknown as Story[]).forEach(s => {
  if (s && s.slug && !storyMap.has(s.slug)) {
    storyMap.set(s.slug, s);
  }
});

export const INITIAL_STORIES: Story[] = Array.from(storyMap.values());


