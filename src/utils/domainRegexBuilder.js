export default function domainRegexBuilder(domain) {
    const escapedDomain = domain.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const regexPattern =
        `^(https?:\\/\\/)?(www\\.)?(${escapedDomain})(:\\d+)?(\\/.*)?$`;

    return new RegExp(regexPattern, "i");
}
