import { FadeImage } from "../movies/components/FadeImage";
import { profileSource } from "../movies/images";
import type { CastMember } from "../movies/types";

const TOP_CAST = 8;

export function CastList({ cast }: { cast: CastMember[] }) {
  return (
    <section aria-labelledby="cast-heading" className="movie__section">
      <h2 id="cast-heading">Top cast</h2>
      <ul className="cast-list">
        {cast.slice(0, TOP_CAST).map((member) => {
          const photo = member.profilePath ? profileSource(member.profilePath) : undefined;
          return (
            <li className="cast-member" key={member.id}>
              <div className="cast-member__photo">
                {photo && <FadeImage alt="" loading="lazy" sizes="48px" src={photo.src} srcSet={photo.srcSet} />}
              </div>
              <div className="cast-member__text">
                <span className="cast-member__name">{member.name}</span>
                {member.character && <span className="cast-member__role">{member.character}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
