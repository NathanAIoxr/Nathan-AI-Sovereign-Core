#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

@interface KKPlayer : UIViewController <WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, UIDocumentPickerDelegate>
@property(nonatomic,strong) WKWebView *web;
@property(nonatomic,strong) NSMutableDictionary<NSString*,NSString*> *saves;
@property(nonatomic,strong) NSMutableArray *errors;
@property(nonatomic,strong) NSURL *webRoot;
@property(nonatomic,strong) NSURL *saveURL;
@property(nonatomic,strong) NSURL *backupURL;
@property(nonatomic,copy) NSString *saveError;
@end

@implementation KKPlayer
- (void)viewDidLoad {
  [super viewDidLoad];
  self.title = @"KK — The New Creature";
  self.view.backgroundColor = [UIColor colorWithRed:.03 green:.07 blue:.12 alpha:1];
  self.errors = [NSMutableArray array];
  NSURL *support = [[[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] firstObject];
  [[NSFileManager defaultManager] createDirectoryAtURL:support withIntermediateDirectories:YES attributes:@{NSFileProtectionKey:NSFileProtectionCompleteUntilFirstUserAuthentication} error:nil];
  self.saveURL = [support URLByAppendingPathComponent:@"KK-progress.json"];
  self.backupURL = [support URLByAppendingPathComponent:@"KK-progress.previous.json"];
  NSData *bytes = [NSData dataWithContentsOfURL:self.saveURL];
  id saved = bytes ? [NSJSONSerialization JSONObjectWithData:bytes options:NSJSONReadingMutableContainers error:nil] : nil;
  if (![self validSaves:saved]) {
    NSData *previous = [NSData dataWithContentsOfURL:self.backupURL];
    saved = previous ? [NSJSONSerialization JSONObjectWithData:previous options:NSJSONReadingMutableContainers error:nil] : nil;
  }
  self.saves = [self validSaves:saved] ? [saved mutableCopy] : [NSMutableDictionary dictionary];
  self.webRoot = [[NSBundle mainBundle] URLForResource:@"Web" withExtension:nil];
  self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"Home" style:UIBarButtonItemStylePlain target:self action:@selector(home)];
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"Saves" style:UIBarButtonItemStylePlain target:self action:@selector(menu)];
  [self makeWeb];
  [self home];
}
- (BOOL)validSaves:(id)object {
  if (![object isKindOfClass:NSDictionary.class] || [object count] > 500) return NO;
  NSUInteger total = 0;
  for (id key in object) {
    id value = object[key];
    if (![key isKindOfClass:NSString.class] || [key length] > 256 || ![value isKindOfClass:NSString.class] || [value length] > 2000000) return NO;
    total += [value length];
  }
  return total <= 10000000;
}
- (void)makeWeb {
  WKWebViewConfiguration *config = [WKWebViewConfiguration new];
  config.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
  [config.userContentController addScriptMessageHandler:self name:@"kkNative"];
  NSData *seedData = [NSJSONSerialization dataWithJSONObject:self.saves options:NSJSONWritingFragmentsAllowed error:nil];
  NSString *seed = [[NSString alloc] initWithData:seedData encoding:NSUTF8StringEncoding] ?: @"{}";
  NSString *script = [NSString stringWithContentsOfURL:[[NSBundle mainBundle] URLForResource:@"bridge" withExtension:@"js"] encoding:NSUTF8StringEncoding error:nil];
  script = [script stringByReplacingOccurrencesOfString:@"__KK_SEED__" withString:seed];
  [config.userContentController addUserScript:[[WKUserScript alloc] initWithSource:script injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
  self.web = [[WKWebView alloc] initWithFrame:CGRectZero configuration:config];
  self.web.navigationDelegate = self;
  self.web.UIDelegate = self;
  self.web.translatesAutoresizingMaskIntoConstraints = NO;
  self.web.opaque = NO;
  self.web.backgroundColor = self.view.backgroundColor;
  self.web.scrollView.backgroundColor = self.view.backgroundColor;
  self.web.allowsBackForwardNavigationGestures = YES;
  [self.view addSubview:self.web];
  [NSLayoutConstraint activateConstraints:@[
    [self.web.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor],
    [self.web.bottomAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.bottomAnchor],
    [self.web.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [self.web.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor]]];
}
- (void)updateSeed {
  WKUserContentController *controller = self.web.configuration.userContentController;
  [controller removeAllUserScripts];
  NSData *seedData = [NSJSONSerialization dataWithJSONObject:self.saves options:0 error:nil];
  NSString *seed = [[NSString alloc] initWithData:seedData encoding:NSUTF8StringEncoding] ?: @"{}";
  NSString *script = [NSString stringWithContentsOfURL:[[NSBundle mainBundle] URLForResource:@"bridge" withExtension:@"js"] encoding:NSUTF8StringEncoding error:nil];
  [controller addUserScript:[[WKUserScript alloc] initWithSource:[script stringByReplacingOccurrencesOfString:@"__KK_SEED__" withString:seed] injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
}
- (void)home {
  [self updateSeed];
  NSURL *url = [self.webRoot URLByAppendingPathComponent:@"index.html"];
  [self.web loadFileURL:url allowingReadAccessToURL:self.webRoot];
}
- (BOOL)persist {
  NSError *error = nil;
  NSData *data = [NSJSONSerialization dataWithJSONObject:self.saves options:0 error:&error];
  if (!data) { self.saveError = error.localizedDescription; return NO; }
  NSData *previous = [NSData dataWithContentsOfURL:self.saveURL];
  if (previous) [previous writeToURL:self.backupURL options:NSDataWritingAtomic | NSDataWritingFileProtectionCompleteUntilFirstUserAuthentication error:nil];
  BOOL ok = [data writeToURL:self.saveURL options:NSDataWritingAtomic | NSDataWritingFileProtectionCompleteUntilFirstUserAuthentication error:&error];
  self.saveError = ok ? nil : error.localizedDescription;
  if (!ok) [self message:@"Save needs attention" text:self.saveError ?: @"Use Backup all progress before closing."];
  return ok;
}
- (BOOL)localURL:(NSURL*)url {
  if (!url.isFileURL || !self.webRoot) return NO;
  NSString *root = [self.webRoot.URLByResolvingSymlinksInPath.path stringByAppendingString:@"/"];
  return [url.URLByResolvingSymlinksInPath.path hasPrefix:root];
}
- (void)userContentController:(WKUserContentController*)controller didReceiveScriptMessage:(WKScriptMessage*)message {
  if (![self localURL:message.frameInfo.request.URL] && ![message.frameInfo.request.URL.absoluteString isEqualToString:@"about:srcdoc"]) return;
  if (![message.body isKindOfClass:NSDictionary.class]) return;
  NSDictionary *body = message.body;
  NSString *action = body[@"action"], *key = body[@"key"];
  if ([action isEqual:@"set"] && [key isKindOfClass:NSString.class] && [body[@"value"] isKindOfClass:NSString.class]) {
    NSMutableDictionary *next = [self.saves mutableCopy]; next[key] = body[@"value"];
    if ([self validSaves:next]) { self.saves = next; [self persist]; }
    else [self message:@"Save is too large" text:@"Export a backup before continuing."];
  } else if ([action isEqual:@"remove"] && [key isKindOfClass:NSString.class]) {
    [self.saves removeObjectForKey:key]; [self persist];
  } else if ([action isEqual:@"export"] && [body[@"data"] isKindOfClass:NSString.class] && [body[@"data"] length] <= 7000000) {
    NSData *data = [[NSData alloc] initWithBase64EncodedString:body[@"data"] options:0];
    NSString *name = [body[@"name"] isKindOfClass:NSString.class] ? [body[@"name"] lastPathComponent] : @"KK-export.json";
    if (data) [self shareData:data name:name];
  } else if ([action isEqual:@"error"] && [body[@"message"] isKindOfClass:NSString.class]) {
    [self.errors addObject:@{@"at":@([[NSDate date] timeIntervalSince1970]),@"message":body[@"message"]}];
    if (self.errors.count > 100) [self.errors removeObjectAtIndex:0];
  } else if ([action isEqual:@"selftest"] && [NSProcessInfo.processInfo.arguments containsObject:@"--kk-self-test"]) {
    NSData *data = [NSJSONSerialization dataWithJSONObject:@{@"fixture":body,@"saves":self.saves,@"saveError":self.saveError ?: @""} options:0 error:nil];
    NSURL *directory = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
    [data writeToURL:[directory URLByAppendingPathComponent:@"selftest.json"] atomically:YES];
  }
}
- (void)message:(NSString*)title text:(NSString*)text {
  if (self.presentedViewController) return;
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:title message:text preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:nil]];
  [self presentViewController:alert animated:YES completion:nil];
}
- (void)shareURL:(NSURL*)url {
  UIActivityViewController *sheet = [[UIActivityViewController alloc] initWithActivityItems:@[url] applicationActivities:nil];
  sheet.popoverPresentationController.barButtonItem = self.navigationItem.rightBarButtonItem;
  [self presentViewController:sheet animated:YES completion:nil];
}
- (void)shareData:(NSData*)data name:(NSString*)name {
  NSURL *directory = [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:NSUUID.UUID.UUIDString];
  [[NSFileManager defaultManager] createDirectoryAtURL:directory withIntermediateDirectories:YES attributes:nil error:nil];
  NSURL *url = [directory URLByAppendingPathComponent:name.length ? name : @"KK-export.json"];
  NSError *error = nil;
  if ([data writeToURL:url options:NSDataWritingAtomic error:&error]) [self shareURL:url];
  else [self message:@"Export failed" text:error.localizedDescription];
}
- (void)backup {
  NSDictionary *payload = @{@"app":@"KK_THE_NEW_CREATURE_IOS", @"version":@1, @"created":@([[NSDate date] timeIntervalSince1970]), @"saves":self.saves};
  [self shareData:[NSJSONSerialization dataWithJSONObject:payload options:NSJSONWritingPrettyPrinted error:nil] name:@"KK-all-progress.json"];
}
- (void)menu {
  UIAlertController *menu = [UIAlertController alertControllerWithTitle:@"KK — Saves & Testing" message:[NSString stringWithFormat:@"%lu save namespaces · %@",(unsigned long)self.saves.count,self.saveError ?: @"On-device storage ready"] preferredStyle:UIAlertControllerStyleActionSheet];
  [menu addAction:[UIAlertAction actionWithTitle:@"Backup all progress" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){ [self backup]; }]];
  [menu addAction:[UIAlertAction actionWithTitle:@"Restore progress backup" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){
    UIDocumentPickerViewController *picker = [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:@[UTTypeJSON] asCopy:YES]; picker.delegate = self;
    [self presentViewController:picker animated:YES completion:nil];
  }]];
  [menu addAction:[UIAlertAction actionWithTitle:@"Export test report" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){
    NSDictionary *report = @{@"app":@"KK",@"version":@"1.0.0",@"ios":UIDevice.currentDevice.systemVersion,@"device":UIDevice.currentDevice.model,@"saveKeys":self.saves.allKeys,@"saveError":self.saveError ?: @"",@"errors":self.errors,@"note":@"No progress values or account credentials included."};
    [self shareData:[NSJSONSerialization dataWithJSONObject:report options:NSJSONWritingPrettyPrinted error:nil] name:@"KK-test-report.json"];
  }]];
  for (NSString *name in @[@"Original-v043.zip",@"Original-v044.zip"]) {
    NSURL *url = [[[NSBundle mainBundle] resourceURL] URLByAppendingPathComponent:[@"SourceArchives/" stringByAppendingString:name]];
    if ([[NSFileManager defaultManager] fileExistsAtPath:url.path]) [menu addAction:[UIAlertAction actionWithTitle:[@"Export " stringByAppendingString:name] style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){ [self shareURL:url]; }]];
  }
  [menu addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:nil]];
  menu.popoverPresentationController.barButtonItem = self.navigationItem.rightBarButtonItem;
  [self presentViewController:menu animated:YES completion:nil];
}
- (void)documentPicker:(UIDocumentPickerViewController*)controller didPickDocumentsAtURLs:(NSArray<NSURL*>*)urls {
  NSURL *url = urls.firstObject;
  BOOL access = [url startAccessingSecurityScopedResource];
  NSNumber *size = nil; [url getResourceValue:&size forKey:NSURLFileSizeKey error:nil];
  NSData *bytes = size.unsignedLongLongValue <= 12000000 ? [NSData dataWithContentsOfURL:url] : nil;
  if (access) [url stopAccessingSecurityScopedResource];
  id backup = bytes ? [NSJSONSerialization JSONObjectWithData:bytes options:0 error:nil] : nil;
  if (![backup isKindOfClass:NSDictionary.class] || ![backup[@"app"] isEqual:@"KK_THE_NEW_CREATURE_IOS"] || ![backup[@"version"] isEqual:@1] || ![self validSaves:backup[@"saves"]]) {
    [self message:@"Backup was not imported" text:@"Choose a KK-all-progress.json backup. Individual game backups can be imported inside that game."]; return;
  }
  NSDictionary *incoming = backup[@"saves"];
  NSMutableDictionary *merged = [self.saves mutableCopy]; [merged addEntriesFromDictionary:incoming];
  if (![self validSaves:merged]) { [self message:@"Backup was not imported" text:@"Combined save size exceeds the limit."]; return; }
  UIAlertController *confirm = [UIAlertController alertControllerWithTitle:@"Restore this backup?" message:@"Matching game saves will be replaced. Other saves remain. The previous on-device snapshot is retained." preferredStyle:UIAlertControllerStyleAlert];
  [confirm addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:nil]];
  [confirm addAction:[UIAlertAction actionWithTitle:@"Restore" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){ self.saves = merged; if ([self persist]) [self home]; }]];
  [self presentViewController:confirm animated:YES completion:nil];
}
- (void)webView:(WKWebView*)web decidePolicyForNavigationAction:(WKNavigationAction*)action decisionHandler:(void (^)(WKNavigationActionPolicy))handler {
  NSURL *url = action.request.URL;
  if ([self localURL:url] || [url.absoluteString isEqual:@"about:blank"] || [url.absoluteString isEqual:@"about:srcdoc"]) {
    [self updateSeed]; handler(WKNavigationActionPolicyAllow); return;
  }
  handler(WKNavigationActionPolicyCancel);
  if (([url.scheme isEqual:@"https"] || [url.scheme isEqual:@"http"]) && action.navigationType == WKNavigationTypeLinkActivated) {
    UIAlertController *confirm = [UIAlertController alertControllerWithTitle:@"Open external reference?" message:url.host preferredStyle:UIAlertControllerStyleAlert];
    [confirm addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:nil]];
    [confirm addAction:[UIAlertAction actionWithTitle:@"Open Safari" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){ [UIApplication.sharedApplication openURL:url options:@{} completionHandler:nil]; }]];
    [self presentViewController:confirm animated:YES completion:nil];
  }
}
- (WKWebView*)webView:(WKWebView*)web createWebViewWithConfiguration:(WKWebViewConfiguration*)config forNavigationAction:(WKNavigationAction*)action windowFeatures:(WKWindowFeatures*)features {
  if ([self localURL:action.request.URL]) { [self updateSeed]; [self.web loadFileURL:action.request.URL allowingReadAccessToURL:self.webRoot]; }
  return nil;
}
- (void)webView:(WKWebView*)web runJavaScriptAlertPanelWithMessage:(NSString*)message initiatedByFrame:(WKFrameInfo*)frame completionHandler:(void (^)(void))completion {
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"KK" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){completion();}]];
  [self presentViewController:alert animated:YES completion:nil];
}
- (void)webView:(WKWebView*)web runJavaScriptConfirmPanelWithMessage:(NSString*)message initiatedByFrame:(WKFrameInfo*)frame completionHandler:(void (^)(BOOL))completion {
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"KK" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *a){completion(NO);}]];
  [alert addAction:[UIAlertAction actionWithTitle:@"Continue" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a){completion(YES);}]];
  [self presentViewController:alert animated:YES completion:nil];
}
- (void)webViewWebContentProcessDidTerminate:(WKWebView*)web { [self updateSeed]; [web reload]; }
- (void)webView:(WKWebView*)web didFailProvisionalNavigation:(WKNavigation*)navigation withError:(NSError*)error {
  if (error.code != NSURLErrorCancelled) [self message:@"Page could not open" text:error.localizedDescription];
}
@end

@interface KKApp : UIResponder <UIApplicationDelegate>
@property(nonatomic,strong) UIWindow *window;
@end
@implementation KKApp
- (BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)options {
  self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
  UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:[KKPlayer new]];
  nav.navigationBar.barStyle = UIBarStyleBlack;
  nav.navigationBar.tintColor = [UIColor colorWithRed:1 green:.86 blue:.57 alpha:1];
  self.window.rootViewController = nav;
  [self.window makeKeyAndVisible];
  return YES;
}
@end
int main(int argc, char *argv[]) { @autoreleasepool { return UIApplicationMain(argc,argv,nil,NSStringFromClass(KKApp.class)); } }
