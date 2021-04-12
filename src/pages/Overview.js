import React from 'react';

export default function Overview(props) {
  return (
    <main className="panel-welcome mt-5 container">
      <div className="lead row mt-5 mb-3">
        <div className="col-xs-10 col-md-8 mx-auto px-4">
          <h1 className="card-title">Overview</h1>
        </div>
        <div className="col-xs-10 col-md-8 mx-auto mb-3 px-4">
          This site allows you engage with the Stacks Proof of Transfer consensus algorithm through
          delegated stacking.
        </div>
        <div className="col-xs-10 col-md-8 mx-auto mb-3 px-4">
          You can learn about delegated stacking at
          <ul>
            <li>
              <a href="https://stacks101.com">stacks101.com</a>
            </li>
            <li>
              <a href="stacking.club/learn">stacking.club/learn</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
