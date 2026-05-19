import { HttpCrawler, HttpCrawlerOptions, HttpCrawlingContext, log, LogLevel } from 'crawlee';

log.setLevel(LogLevel.OFF);

export function createHttpCrawler(
  options: HttpCrawlerOptions<HttpCrawlingContext>
): HttpCrawler<HttpCrawlingContext> {
  return new HttpCrawler<HttpCrawlingContext>({
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 30,
    ...options,
  });
}
