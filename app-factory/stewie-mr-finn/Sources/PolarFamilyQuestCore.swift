import Foundation

// MARK: - Self-contained, offline polar quest rules and educational content.
// This file is Foundation-only so its story data and unlock rules can be tested
// without SwiftUI or an Apple signing identity.

enum PolarRegion: String, Codable, CaseIterable {
    case north, south
    var title: String { self == .north ? "NORTH PAW" : "SOUTH PAW" }
    var greeting: String { self == .north ? "HO HO HO!" : "OH OH OH!" }
    var symbol: String { self == .north ? "🎅🐕" : "🐧❄️" }
}
enum PolarChallengeType: String, Codable {
    case hear, mirror, numbers, care, nature
    var caption: String {
        switch self {
        case .hear: return "ABOVE C • LISTEN"
        case .mirror: return "BELOW C • MIRROR"
        case .numbers: return "COUNT & COMPARE"
        case .care: return "CHOOSE KINDNESS"
        case .nature: return "DISCOVER NATURE"
        }
    }
}
struct PolarQuiz: Identifiable {
    let id: Int
    let kind: PolarChallengeType
    let question: String
    let options: [String]
    let correct: Int
    let explanation: String
    init(_ id: Int, _ kind: PolarChallengeType, _ question: String, _ options: [String], _ correct: Int, _ explanation: String) {
        self.id=id; self.kind=kind; self.question=question
        self.options=options; self.correct=correct; self.explanation=explanation
    }
    var valid: Bool {
        options.count == 4 && Set(options).count == 4 && (0..<4).contains(correct) && !question.isEmpty && !explanation.isEmpty
    }
}
struct PolarChapter: Identifiable {
    let id: Int
    let title: String
    let guide: String
    let icon: String
    let story: String
    let puzzles: [PolarQuiz]
    var region: PolarRegion { id <= 8 ? .north : .south }
}
enum PolarFamilyCatalog {
    static let chapters: [PolarChapter] = [
        .init(id: 1,title:"Santa Dog's Welcome",guide:"HO HO HO Santa Dog",icon:"🎅",story:"The North Paw village gate opens when the right words meet a kind heart.",puzzles:[
            .init(1,.hear,"What does Santa Dog mean when he shouts HO HO HO?",["A friendly holiday greeting","A threat","A weather forecast","A secret password for only some dogs"],0,"In this story, HO HO HO is Santa Dog's welcoming greeting."),
            .init(2,.mirror,"Read HO exactly backward. What do you see?",["HH","OH","OO","HOHO"],1,"The two letters reverse to OH. Reverse OH again and you return to HO."),
            .init(3,.care,"A new dog feels uncertain at the gate. What should Santa Dog do?",["Rush up and hug","Force a greeting","Offer space and a calm welcome","Block the exit"],2,"A safe welcome lets the other animal decide whether to come closer.")]),
        .init(id: 2,title:"Holly's Trust Trail",guide:"Holly Howl",icon:"🐕",story:"Holly guides the team through a trail where listening matters more than speed.",puzzles:[
            .init(1,.care,"A dog turns away when someone reaches toward her. What now?",["Follow and grab","Give her room","Shout louder","Corner her"],1,"Turning away can signal discomfort. Respect her choice."),
            .init(2,.hear,"Which message does a warning growl most often communicate?",["I need some distance","I agree to be hugged","Please ignore me","Keep approaching faster"],0,"A growl can be a request for distance. Ask an adult for help around unfamiliar animals."),
            .init(3,.numbers,"Holly marks a trail with 3 paw prints, then 2 more. Total?",["4","6","3","5"],3,"3 + 2 = 5 paw prints.")]),
        .init(id: 3,title:"Peppermint's Workshop",guide:"Peppermint Dot",icon:"🎁",story:"The Dalmatian inventor needs careful helpers to pack the holiday gifts.",puzzles:[
            .init(1,.numbers,"There are 4 red presents and 3 blue presents. How many?",["12","7","6","5"],1,"4 + 3 = 7 presents."),
            .init(2,.mirror,"Reverse the letters in PAWS. What do they spell?",["SWAP","WASP","PASA","SPAW"],0,"PAWS reverses exactly to SWAP: P-A-W-S → S-W-A-P."),
            .init(3,.care,"One helper wants a quieter job. What should the team do?",["Make everyone do the loud job","Exclude the helper","Offer a calm choice","Ignore the request"],2,"Different needs deserve equal respect and meaningful options.")]),
        .init(id: 4,title:"Pip & Poppy's Patterns",guide:"Pip and Poppy",icon:"🐾",story:"The pups discover the same pattern can look different when reflected.",puzzles:[
            .init(1,.mirror,"Which short word reads the same backward?",["DOG","CAT","BOB","PAW"],2,"BOB is a palindrome: the order stays B-O-B when reversed."),
            .init(2,.numbers,"Two pups each carry 2 pretend biscuits. How many together?",["2","4","6","8"],1,"2 × 2 = 4 biscuits."),
            .init(3,.hear,"If one pup says NO to a game, what does NO mean?",["Keep asking","Stop and respect the answer","Make the pup play","Pretend the pup said yes"],1,"No is a complete answer. Everyone gets to choose when they participate.")]),
        .init(id: 5,title:"Biscuits & Bark",guide:"Jingle Jack",icon:"🍪",story:"An enthusiastic beagle helps the cats solve a deliciously confusing clue.",puzzles:[
            .init(1,.hear,"BARK might mean a sound from a dog or...",["A piece of cloud","The outside of a tree","A kind of snowflake","A number"],1,"Bark has more than one meaning; context decides which one is intended."),
            .init(2,.numbers,"Six pretend biscuits are shared equally by 3 friends. Each gets...",["1","3","6","2"],3,"6 ÷ 3 = 2 biscuits each."),
            .init(3,.care,"A dog has a food allergy. What's the safe choice?",["Share an unknown snack","Ask a responsible grown-up before feeding","Hide the label","Give extra"],1,"Never give an unfamiliar animal food without its caregiver's permission.")]),
        .init(id: 6,title:"Blizzard's Aurora Trail",guide:"Blizzard Belle",icon:"🌌",story:"A husky navigator follows the dancing light above the winter forest.",puzzles:[
            .init(1,.nature,"What causes natural auroras high in Earth's atmosphere?",["Colored fireworks","Charged particles and atmospheric gases","Glowing snowflakes","Reflected streetlights"],1,"Charged particles from space interact with gases in Earth's atmosphere, producing auroral light."),
            .init(2,.mirror,"Which spelling reverses NORTH exactly?",["HTRON","NORHT","TRONH","HRTON"],0,"N-O-R-T-H becomes H-T-R-O-N."),
            .init(3,.numbers,"Five lanterns shine on one path and 5 on another. Total?",["15","5","25","10"],3,"5 + 5 = 10 lanterns.")]),
        .init(id: 7,title:"The North Paw Express",guide:"Juniper Jingles",icon:"🚂",story:"The friendship train delivers packages to every cottage—without leaving anyone behind.",puzzles:[
            .init(1,.numbers,"The train visits houses 2, 4, 6. Which is next in this pattern?",["10","8","7","5"],1,"The sequence grows by 2 each time."),
            .init(2,.hear,"What matters when a friend says the word PRESENT?",["Context: a gift, being here, or a moment in time","It always means a wrapped gift","It has only one use","It is always the past"],0,"Present has multiple English uses; listen to the sentence."),
            .init(3,.care,"An older dog needs more time boarding. What do the others do?",["Leave early","Rush the dog","Make a safe, patient plan","Close the door"],2,"Accessibility, patience and safety belong in every community.")]),
        .init(id: 8,title:"The Great North Sleigh",guide:"Santa Dog and friends",icon:"🛷",story:"The North Paw Friendship Star is ready. The cats set course for the imaginary South Paw portal.",puzzles:[
            .init(1,.mirror,"Reverse the greeting HO HO HO character by character. You get...",["HO OH HO","OH OH OH","OOO HHH","HO HO HO"],1,"Reversing the entire string swaps each HO to OH and reverses the spaces too."),
            .init(2,.numbers,"Four gift bags hold 2 toys each. How many toys?",["8","6","4","12"],0,"4 × 2 = 8 toys."),
            .init(3,.care,"The sleigh team disagrees on the route. Best next step?",["Ignore everyone","Push ahead blindly","Blame a teammate","Listen, compare ideas and choose a safe plan"],3,"Cooperation means hearing others while still checking safety.")]),
        .init(id: 9,title:"Ozzie's South Paw Gate",guide:"OH OH OH Ozzie",icon:"🐧",story:"The portal opens in a sparkling fictional Antarctic village. Ozzie's family welcomes the cats.",puzzles:[
            .init(1,.hear,"In this story, OH OH OH expresses...",["Fear of new friends","Anger at visitors","Surprise and curiosity","An order to go away"],2,"Ozzie uses OH OH OH as a friendly expression of wonder."),
            .init(2,.mirror,"Read OH in reverse. What do you get?",["HO","OO","HH","HOH"],0,"O-H becomes H-O."),
            .init(3,.nature,"Where do wild emperor penguins naturally live?",["At the geographic North Pole","Antarctica","In every tropical forest","On the Moon"],1,"Emperor penguins are native to Antarctica. This crossover between poles happens through a fantasy portal.")]),
        .init(id: 10,title:"Oona's Southern Lights",guide:"Oona Aurora",icon:"✨",story:"Oona teaches the visitors to watch the beautiful lights above South Paw.",puzzles:[
            .init(1,.nature,"What is another name for the Southern Lights?",["Aurora australis","Aurora borealis only","Solar eclipse","Milky snow"],0,"Aurora australis is the southern aurora. Aurora borealis is the northern aurora."),
            .init(2,.numbers,"An ice arch has 3 glowing lights on each of 3 sides. Total?",["6","9","12","3"],1,"3 × 3 = 9 lights."),
            .init(3,.care,"A friend gets overwhelmed by bright lights. What's thoughtful?",["Demand they look","Tease them","Offer a quieter route","Turn the lights brighter"],2,"Kindness includes adapting activities to different sensory needs.")]),
        .init(id: 11,title:"Opal's Ice Mirror",guide:"Opal Flip",icon:"🪞",story:"The mirrored ice walls carry different messages depending on how you read them.",puzzles:[
            .init(1,.mirror,"Which is the exact reverse of ICE?",["IEC","CIE","ECI","ECIC"],2,"I-C-E becomes E-C-I."),
            .init(2,.mirror,"Reverse ECHO. What sequence appears?",["OEHC","ECOH","HEOC","OHCE"],3,"E-C-H-O reverses to O-H-C-E."),
            .init(3,.hear,"Does reversing a word automatically give its historical meaning?",["Yes, every time","No; it changes written order","Only if it is four letters","Only when it is in a mirror"],1,"A letter reversal is an exact operation, not evidence of etymology.")]),
        .init(id: 12,title:"Otto's Star Clock",guide:"Otto Orbit",icon:"⭐",story:"Otto watches the sky and invites the cats to compare patterns, not make guesses.",puzzles:[
            .init(1,.nature,"What is a star such as the Sun?",["A frozen moon","A glowing ball of plasma","A white cloud","A planet with no light"],1,"A star emits light and energy through processes including nuclear fusion."),
            .init(2,.numbers,"Four pairs of telescope lenses means how many lenses?",["4","6","10","8"],3,"4 pairs × 2 = 8 lenses."),
            .init(3,.hear,"STAR might also refer to...",["A famous performer","A kind of biscuit only","An arctic fish","A year"],0,"Words may have multiple conventional meanings depending on context.")]),
        .init(id: 13,title:"Olive's Ocean Crossing",guide:"Olive Current",icon:"🐋",story:"Olive the orca guides the visitors through the icy-water pathways.",puzzles:[
            .init(1,.nature,"An orca is which kind of animal?",["A shark","A seal","A marine mammal","A penguin"],2,"Orcas are toothed whales and mammals that breathe air."),
            .init(2,.numbers,"Five seals rest on ice. Two swim away. How many remain?",["3","5","7","2"],0,"5 − 2 = 3 seals."),
            .init(3,.care,"How should people treat wild marine mammals?",["Touch and chase them","Observe respectfully from a safe distance","Feed them sweets","Crowd their resting place"],1,"Wildlife needs space, and local protection rules may apply.")]),
        .init(id: 14,title:"Ollie's Echo Cave",guide:"Ollie Echo",icon:"🎵",story:"The cave repeats words back to explorers, giving the cats another way to test what they heard.",puzzles:[
            .init(1,.nature,"What causes an echo?",["Light changing color","The moon changing shape","A sound reflecting off a surface","A silent picture"],2,"An echo is sound reflected back after traveling to a surface."),
            .init(2,.mirror,"What does SOUND become when reversed?",["DNOSU","DN UOS","DOSNU","DNUOS"],3,"S-O-U-N-D becomes D-N-U-O-S."),
            .init(3,.hear,"SEA and SEE can sound alike. How do you tell which was meant?",["Use the sentence and context","Only count the letters","Always choose SEA","Guess that both mean ocean"],0,"Homophones can sound alike but have different spellings and meanings.")]),
        .init(id: 15,title:"The Twin Scarf Switch",guide:"Odie and Oda",icon:"🧣",story:"Twin penguin chicks create a two-color puzzle on the bridge.",puzzles:[
            .init(1,.mirror,"The scarf pattern is RED then BLUE. Reverse the order.",["RED, RED","BLUE, RED","BLUE, BLUE","RED, BLUE"],1,"Reversing order swaps the two positions but doesn't change either color."),
            .init(2,.numbers,"Each twin has 3 buttons. Both twins together have...",["3","5","9","6"],3,"3 + 3 = 6 buttons."),
            .init(3,.care,"A twin dislikes having their scarf touched. What is respectful?",["Take it anyway","Insist on matching","Ask permission and respect no","Hide their scarf"],2,"A person's or animal's boundaries matter even during a game.")]),
        .init(id: 16,title:"THE MIDDLE C REUNION",guide:"Stewie, Finn, Santa Dog and Ozzie",icon:"🌈",story:"All the families cross the magical bridge, where opposite patterns meet without becoming the same.",puzzles:[
            .init(1,.hear,"What should you check when two words sound alike?",["Only how many letters each has","Their meaning, context and spelling","Their colors","Whether a pet likes them"],1,"Above C asks what was said and what was meant."),
            .init(2,.mirror,"Which statement is always true when a string is reversed twice?",["It loses one letter","It becomes a new alphabet","It becomes a different spoken language","It returns to the original string"],3,"For an exact reversal operation R, R(R(x)) = x."),
            .init(3,.numbers,"Two equal and opposite torques on one axle give zero...",["Angular acceleration, if the net torque is zero","Angular velocity in every situation","Mass of the axle","Time passing"],0,"With net torque zero, angular acceleration is zero; an axle already spinning need not stop.")])
    ]
    static func chapter(_ id: Int) -> PolarChapter? { chapters.first { $0.id == id } }
    static var isValid: Bool {
        chapters.count == 16 && chapters.enumerated().allSatisfy { index, chapter in
            chapter.id == index + 1 && chapter.puzzles.count == 3 &&
            Set(chapter.puzzles.map(\.id)).count == 3 && chapter.puzzles.allSatisfy(\.valid)
        }
    }
}
struct PolarFamilySave: Codable, Equatable {
    var ratings: [Int: Int] = [:]
    var completedQuestions: Int = 0
    func isUnlocked(_ id: Int) -> Bool { id == 1 || (2...16).contains(id) && ratings[id-1] != nil }
    var stars: Int { ratings.values.reduce(0,+) }
    var completed: Int { ratings.count }
    var northComplete: Bool { (1...8).allSatisfy { ratings[$0] != nil } }
    var southComplete: Bool { (9...16).allSatisfy { ratings[$0] != nil } }
    var reunionComplete: Bool { ratings[16] != nil }
    mutating func complete(chapter id: Int, correct: Int) {
        guard (1...16).contains(id), isUnlocked(id), (0...3).contains(correct) else { return }
        let firstCompletion = ratings[id] == nil
        let award = max(1,correct)
        ratings[id] = max(ratings[id] ?? 0,award)
        if firstCompletion { completedQuestions += 3 }
    }
    static func restored(_ raw: String) -> PolarFamilySave {
        guard let data = raw.data(using:.utf8),
              let saved = try? JSONDecoder().decode(PolarFamilySave.self,from:data) else { return .init() }
        // Never trust corrupt/foreign state to create phantom unlocks or arbitrary stars.
        var clean = PolarFamilySave()
        for id in 1...16 {
            if let rating = saved.ratings[id], (1...3).contains(rating),
                clean.isUnlocked(id) { clean.ratings[id] = rating }
        }
        clean.completedQuestions = clean.ratings.count * 3
        return clean
    }
    func serialized() -> String {
        guard let data = try? JSONEncoder().encode(self) else { return "" }
        return String(data:data,encoding:.utf8) ?? ""
    }
}


// Separate chapter checkpoint: scores are derived from validated answers, never trusted.
struct PolarChapterAttempt: Codable, Equatable {
    var answers: [Int] = []
    var advanced: Int = 0
    var isComplete: Bool { advanced == 3 }
    var questionIndex: Int { min(advanced, 2) }
    var selected: Int? { answers.indices.contains(questionIndex) ? answers[questionIndex] : nil }
    func correct(in chapter: PolarChapter) -> Int {
        zip(answers, chapter.puzzles).filter { $0.0 == $0.1.correct }.count
    }
    mutating func choose(_ option: Int) {
        guard !isComplete, answers.count == advanced, (0..<4).contains(option) else { return }
        answers.append(option)
    }
    mutating func next() {
        guard !isComplete, answers.count == advanced + 1 else { return }
        advanced += 1
    }
    func serialized() -> String {
        guard let data = try? JSONEncoder().encode(self) else { return "" }
        return String(data: data, encoding: .utf8) ?? ""
    }
    static func restored(_ raw: String) -> Self {
        guard let data = raw.data(using: .utf8),
              let saved = try? JSONDecoder().decode(Self.self, from: data),
              (0...3).contains(saved.advanced), saved.answers.count <= 3,
              saved.answers.allSatisfy({ (0..<4).contains($0) }),
              saved.answers.count >= saved.advanced,
              saved.answers.count <= saved.advanced + 1 else { return .init() }
        return saved
    }
}
