// T123-PRICING-ROUTER-001
// Native policy evaluator for iOS apps. Preview only: never charges or creates IAP prices.
import Foundation

public enum FactoryAudience: String, Codable {
    case children, families, general, educators, professionals
}
public enum FactoryAppCategory: String, Codable {
    case story, casual, competitive, sandbox, creator, utility, education, community
}
public enum FactoryPurpose: String, Codable {
    case entertainment, learning, creativity, community, professional
}
public enum FactoryDeliveryCost: String, Codable {
    case low, medium, high
}
public struct FactoryAppProfile: Codable {
    public let id: String
    public let title: String
    public let audience: FactoryAudience
    public let category: FactoryAppCategory
    public let purpose: FactoryPurpose
    public let complexity: Int
    public let deliveryCost: FactoryDeliveryCost
    public let ongoingContent: Bool
    public let multiplayer: Bool
    public let supportsAds: Bool
    public let includesChildren: Bool
    public let freeCore: Bool
    public let ownerPriceBand: String
    public let allowedOfferIds: [String]?
}
public struct FactoryCondition: Codable {
    public let audienceAny: [FactoryAudience]?
    public let categoryAny: [FactoryAppCategory]?
    public let purposeAny: [FactoryPurpose]?
    public let complexityAtLeast: Int?
    public let ongoingContent: Bool?
    public let multiplayer: Bool?
    public let includesChildren: Bool?
}
public struct FactoryRule: Codable {
    public let id: String
    public let when: FactoryCondition
    public let configuration: String
    public let reason: String
}
public struct FactoryConfiguration: Codable {
    public let title: String
    public let offerIds: [String]
}
public struct FactoryPolicy: Codable {
    public let schemaVersion: Int
    public let version: String
    public let configurations: [String: FactoryConfiguration]
    public let rules: [FactoryRule]
}
public struct FactoryOffer: Codable {
    public let id: String
    public let title: String
    public let type: String
    public let description: String
    public let categories: [FactoryAppCategory]
    public let audiences: [FactoryAudience]
    public let previewPriceCents: [String: Int]
    public let requiresAds: Bool?
    public let requiresOngoing: Bool?
}
public struct FactoryCatalog: Codable {
    public let schemaVersion: Int
    public let version: String
    public let currency: String
    public let note: String
    public let offers: [FactoryOffer]
}
public struct FactoryProposedOffer {
    public let id: String
    public let title: String
    public let purchaseType: String
    public let suggestedUSDCents: Int
    public let requiresAdultCheckout: Bool
    public let checkoutEnabled = false
}
public struct FactoryPricingPlan {
    public let configuration: String
    public let configurationName: String
    public let ruleId: String
    public let reason: String
    public let priceBand: String
    public let freeCore: Bool
    public let offers: [FactoryProposedOffer]
    public let releaseStatus = "PREVIEW_ONLY"
}
public enum FactoryPricingError: Error {
    case invalidPolicy, invalidProfile, invalidCatalog
}

public enum Tabor123FactoryPricingRouter {
    private static func matches(_ condition: FactoryCondition, _ app: FactoryAppProfile) -> Bool {
        if let values = condition.audienceAny, !values.contains(app.audience) { return false }
        if let values = condition.categoryAny, !values.contains(app.category) { return false }
        if let values = condition.purposeAny, !values.contains(app.purpose) { return false }
        if let minimum = condition.complexityAtLeast, app.complexity < minimum { return false }
        if let value = condition.ongoingContent, app.ongoingContent != value { return false }
        if let value = condition.multiplayer, app.multiplayer != value { return false }
        let childDirected = app.includesChildren || app.audience == .children || app.audience == .families
        if let value = condition.includesChildren, childDirected != value { return false }
        return true
    }

    private static func priceBand(for app: FactoryAppProfile) -> String {
        if app.ownerPriceBand != "auto" { return app.ownerPriceBand }
        if app.complexity >= 4 && app.deliveryCost == .high { return "advanced" }
        if app.complexity >= 3 || app.deliveryCost != .low { return "standard" }
        return "basic"
    }

    public static func compile(
        app: FactoryAppProfile,
        policy: FactoryPolicy,
        catalog: FactoryCatalog
    ) throws -> FactoryPricingPlan {
        guard policy.schemaVersion == 1, catalog.schemaVersion == 1 else {
            throw FactoryPricingError.invalidPolicy
        }
        guard (1...5).contains(app.complexity),
              !app.id.isEmpty, !app.title.isEmpty,
              ["auto", "basic", "standard", "advanced"].contains(app.ownerPriceBand) else {
            throw FactoryPricingError.invalidProfile
        }
        guard let rule = policy.rules.first(where: { matches($0.when, app) }),
              let config = policy.configurations[rule.configuration] else {
            throw FactoryPricingError.invalidPolicy
        }
        let isChild = app.includesChildren || app.audience == .children || app.audience == .families
        let selectedBand = priceBand(for: app)
        var proposed: [FactoryProposedOffer] = []
        for product in catalog.offers {
            guard config.offerIds.contains(product.id),
                  (app.allowedOfferIds == nil || app.allowedOfferIds!.contains(product.id)),
                  product.categories.contains(app.category),
                  product.audiences.contains(app.audience),
                  product.requiresAds != true || app.supportsAds,
                  product.requiresOngoing != true || app.ongoingContent else { continue }
            if isChild && (product.requiresAds == true ||
                           product.type == "consumable" ||
                           product.type == "auto_renewable") { continue }
            guard let cents = product.previewPriceCents[selectedBand], cents >= 0 else {
                throw FactoryPricingError.invalidCatalog
            }
            proposed.append(FactoryProposedOffer(
                id: product.id, title: product.title,
                purchaseType: product.type, suggestedUSDCents: cents,
                requiresAdultCheckout: isChild
            ))
        }
        return FactoryPricingPlan(
            configuration: rule.configuration,
            configurationName: config.title,
            ruleId: rule.id,
            reason: rule.reason,
            priceBand: selectedBand,
            freeCore: isChild || app.freeCore,
            offers: proposed
        )
    }
}

// Real iOS price labels must instead be read from registered StoreKit products.
#if canImport(StoreKit)
import StoreKit
@available(iOS 15.0, *)
public enum TaborStoreKitProductReader {
    public static func loadRegisteredProducts(ids: Set<String>) async throws -> [Product] {
        return try await Product.products(for: ids)
    }
}
#endif
